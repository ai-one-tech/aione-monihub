use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use chrono::Utc;
use futures_util::StreamExt as _;
use lazy_static::lazy_static;
use sea_orm::{DatabaseConnection, EntityTrait};
use serde::Serialize;
use std::collections::HashMap;
use std::path::Path;
use std::sync::Mutex;
use tokio::fs;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::auth::middleware::get_user_id_from_request_not_throw;
use crate::entities::files;
use crate::shared::error::ApiError;

// 引入模型
use super::models::{
    FileChunkUploadResponse, FileUploadCompleteRequest, FileUploadCompleteResponse,
    FileUploadRequest, FileUploadResponse,
};

// 临时存储上传信息的结构（实际项目中应该使用数据库）
lazy_static! {
    static ref UPLOAD_SESSIONS: Mutex<HashMap<String, UploadSession>> = Mutex::new(HashMap::new());
}

#[derive(Debug, Clone)]
struct UploadSession {
    upload_id: String,
    file_name: String,
    file_size: i64,
    chunk_size: i64,
    total_chunks: i64,
    uploaded_chunks: Vec<bool>,
    file_path: String,
    file_id: String,
    // 新增字段
    task_id: Option<String>,
    instance_id: Option<String>,
    file_extension: Option<String>,
    original_file_path: Option<String>,
    completing: bool,
}

/// 初始化文件上传
///
/// 创建一个新的文件上传会话，返回用于后续上传的upload_id
#[utoipa::path(
    post,
    path = "/api/files/upload/init",
    request_body = FileUploadRequest,
    responses(
        (status = 200, description = "Upload session initialized successfully", body = FileUploadResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Files"
)]
pub async fn init_file_upload(
    db: web::Data<DatabaseConnection>,
    req: HttpRequest,
    upload_request: web::Json<FileUploadRequest>,
) -> Result<HttpResponse, ApiError> {
    // 获取用户ID
    let _user_id = get_user_id_from_request_not_throw(&req);

    if upload_request.instance_id == None {
        return Err(ApiError::BadRequest("Instance ID is required".to_string()));
    }

    // 生成文件记录ID，作为会话与上传ID
    let file_id = Uuid::new_v4().to_string();

    // 目标目录
    let task_dir = upload_request
        .task_id
        .as_ref()
        .map(|t| format!("./uploads/{}", t))
        .unwrap_or_else(|| "./uploads".to_string());

    // 创建上传目录
    fs::create_dir_all(&task_dir).await.map_err(|e| {
        ApiError::InternalServerError(format!("Failed to create upload directory: {}", e))
    })?;

    // 在 files 表中创建记录（开始上传即创建）
    let current_time = Utc::now();
    let initial_file_path = {
        let original_name = upload_request.file_name.clone();
        let ext = upload_request.file_extension.clone().unwrap_or_default();
        let instance_id = upload_request.instance_id.clone().unwrap_or_default();
        format!("{}/{}_{}", task_dir, instance_id, original_name)
    };
    let file_model = files::ActiveModel {
        id: sea_orm::Set(file_id.clone()),
        file_name: sea_orm::Set(upload_request.file_name.clone()),
        file_size: sea_orm::Set(upload_request.file_size),
        file_path: sea_orm::Set(initial_file_path.clone()),
        uploaded_by: sea_orm::Set(_user_id.clone()),
        uploaded_at: sea_orm::Set(current_time.naive_utc()),
        updated_at: sea_orm::Set(current_time.naive_utc()),
        task_id: sea_orm::Set(upload_request.task_id.clone()),
        instance_id: sea_orm::Set(upload_request.instance_id.clone()),
        file_extension: sea_orm::Set(upload_request.file_extension.clone()),
        original_file_path: sea_orm::Set(upload_request.original_file_path.clone()),
    };
    files::Entity::insert(file_model)
        .exec(&**db)
        .await
        .map_err(|e| {
            ApiError::InternalServerError(format!("Failed to create file record: {}", e))
        })?;

    // 创建上传会话
    let session = UploadSession {
        upload_id: file_id.clone(),
        file_name: upload_request.file_name.clone(),
        file_size: upload_request.file_size,
        chunk_size: upload_request.chunk_size,
        total_chunks: upload_request.total_chunks,
        uploaded_chunks: vec![false; upload_request.total_chunks as usize],
        file_path: format!("{}/{}", task_dir, file_id),
        file_id: file_id.clone(),
        task_id: upload_request.task_id.clone(),
        instance_id: upload_request.instance_id.clone(),
        file_extension: upload_request.file_extension.clone(),
        original_file_path: upload_request.original_file_path.clone(),
        completing: false,
    };

    // 保存上传会话
    {
        let mut sessions = UPLOAD_SESSIONS.lock().unwrap();
        sessions.insert(file_id.clone(), session);
    }

    let is_directory = upload_request.is_directory.unwrap_or(false);
    let compressed = is_directory || upload_request.file_name.ends_with(".zip");
    let ext = upload_request.file_extension.clone().unwrap_or_default();
    let instance_id = upload_request.instance_id.clone().unwrap_or_default();
    let final_name = format!("{}_{}", instance_id, upload_request.file_name);

    let download_path = format!("/api/files/download/{}", file_id);

    Ok(HttpResponse::Ok().json(FileUploadResponse {
        upload_id: file_id,
        message: "Upload session initialized successfully".to_string(),
        download_path,
        is_directory,
        compressed,
        final_name,
        size: upload_request.file_size,
        server_file_path: initial_file_path,
    }))
}

/// 上传文件块
///
/// 上传文件的一个块，需要提供upload_id和块索引
#[utoipa::path(
    post,
    path = "/api/files/upload/chunk",
    responses(
        (status = 200, description = "Chunk uploaded successfully", body = FileChunkUploadResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Files"
)]
pub async fn upload_file_chunk(
    db: web::Data<DatabaseConnection>,
    mut payload: Multipart,
) -> Result<HttpResponse, ApiError> {
    let mut upload_id = String::new();
    let mut chunk_index = 0;
    let mut chunk_data = Vec::new();

    // 解析multipart数据
    while let Some(item) = payload.next().await {
        let mut field = item
            .map_err(|e| ApiError::BadRequest(format!("Failed to parse multipart data: {}", e)))?;

        let content_disposition = field.content_disposition();
        let field_name = content_disposition
            .as_ref()
            .and_then(|cd| cd.get_name())
            .unwrap_or("");

        match field_name {
            "upload_id" => {
                let mut data = Vec::new();
                while let Some(chunk) = field.next().await {
                    let chunk = chunk.map_err(|e| {
                        ApiError::BadRequest(format!("Failed to read field data: {}", e))
                    })?;
                    data.extend_from_slice(&chunk);
                }
                upload_id = String::from_utf8(data).map_err(|e| {
                    ApiError::BadRequest(format!("Invalid upload_id format: {}", e))
                })?;
            }
            "chunk_index" => {
                let mut data = Vec::new();
                while let Some(chunk) = field.next().await {
                    let chunk = chunk.map_err(|e| {
                        ApiError::BadRequest(format!("Failed to read field data: {}", e))
                    })?;
                    data.extend_from_slice(&chunk);
                }
                let chunk_index_str = String::from_utf8(data).map_err(|e| {
                    ApiError::BadRequest(format!("Invalid chunk_index format: {}", e))
                })?;
                chunk_index = chunk_index_str.parse().map_err(|e| {
                    ApiError::BadRequest(format!("Invalid chunk_index value: {}", e))
                })?;
            }
            "chunk" => {
                while let Some(chunk) = field.next().await {
                    let chunk = chunk.map_err(|e| {
                        ApiError::BadRequest(format!("Failed to read chunk data: {}", e))
                    })?;
                    chunk_data.extend_from_slice(&chunk);
                }
            }
            _ => {}
        }
    }

    // 验证必要参数
    if upload_id.is_empty() {
        return Err(ApiError::BadRequest(
            "Missing upload_id parameter".to_string(),
        ));
    }

    // 获取上传会话
    let session = {
        let sessions = UPLOAD_SESSIONS.lock().unwrap();
        sessions
            .get(&upload_id)
            .cloned()
            .ok_or_else(|| ApiError::BadRequest("Invalid upload_id".to_string()))?
    };

    // 验证chunk_index
    if chunk_index >= session.total_chunks || chunk_index < 0 {
        return Err(ApiError::BadRequest("Invalid chunk_index".to_string()));
    }

    // 保存文件块（流式写入）
    let chunk_file_path = format!("{}_{}.chunk", session.file_path, chunk_index);
    fs::write(&chunk_file_path, &chunk_data)
        .await
        .map_err(|e| ApiError::InternalServerError(format!("Failed to save chunk: {}", e)))?;

    // 更新上传状态
    let maybe_session_to_merge = {
        let mut sessions = UPLOAD_SESSIONS.lock().unwrap();
        if let Some(session) = sessions.get_mut(&upload_id) {
            if (chunk_index as usize) < session.uploaded_chunks.len() {
                session.uploaded_chunks[chunk_index as usize] = true;
            }
            let all_uploaded = session.uploaded_chunks.iter().all(|&u| u);
            if all_uploaded && !session.completing {
                session.completing = true;
                Some(session.clone())
            } else {
                None
            }
        } else {
            None
        }
    };

    if let Some(session) = maybe_session_to_merge {
        let (file_id, file_path) = merge_chunks_and_update_db(db.clone(), session.clone()).await?;
        {
            let mut sessions = UPLOAD_SESSIONS.lock().unwrap();
            sessions.remove(&upload_id);
        }
        return Ok(HttpResponse::Ok().json(FileChunkUploadResponse {
            upload_id,
            chunk_index,
            message: "Chunk uploaded successfully".to_string(),
            completed: true,
            file_id: Some(file_id),
            file_path: Some(file_path),
        }));
    }

    Ok(HttpResponse::Ok().json(FileChunkUploadResponse {
        upload_id,
        chunk_index,
        message: "Chunk uploaded successfully".to_string(),
        completed: false,
        file_id: None,
        file_path: None,
    }))
}

async fn merge_chunks_and_update_db(
    db: web::Data<DatabaseConnection>,
    session: UploadSession,
) -> Result<(String, String), ApiError> {
    let task_id_dir = session.task_id.clone().unwrap_or_default();
    let base_dir = if task_id_dir.is_empty() {
        "./uploads".to_string()
    } else {
        format!("./uploads/{}", task_id_dir)
    };
    fs::create_dir_all(&base_dir).await.map_err(|e| {
        ApiError::InternalServerError(format!("Failed to create target directory: {}", e))
    })?;
    let instance_id = session.instance_id.clone().unwrap_or_default();
    let ext = session.file_extension.clone().unwrap_or_default();
    let final_name = if !ext.is_empty() {
        format!("{}_{}.{}", instance_id, session.file_name, ext)
    } else {
        format!("{}_{}", instance_id, session.file_name)
    };
    let file_path = format!("{}/{}", base_dir, final_name);
    let mut file = fs::File::create(&file_path)
        .await
        .map_err(|e| ApiError::InternalServerError(format!("Failed to create file: {}", e)))?;

    for i in 0..session.total_chunks {
        let chunk_file_path = format!("{}_{}.chunk", session.file_path, i);
        let mut chunk = fs::File::open(&chunk_file_path).await.map_err(|e| {
            ApiError::InternalServerError(format!("Failed to open chunk {}: {}", i, e))
        })?;
        let mut buf = vec![0u8; 1024 * 1024];
        loop {
            let n = chunk.read(&mut buf).await.map_err(|e| {
                ApiError::InternalServerError(format!("Failed to read chunk {}: {}", i, e))
            })?;
            if n == 0 {
                break;
            }
            file.write_all(&buf[..n]).await.map_err(|e| {
                ApiError::InternalServerError(format!("Failed to write chunk {}: {}", i, e))
            })?;
        }
        let _ = fs::remove_file(&chunk_file_path).await;
    }

    let current_time = Utc::now();
    let am = files::ActiveModel {
        id: sea_orm::Set(session.file_id.clone()),
        file_path: sea_orm::Set(file_path.clone()),
        file_size: sea_orm::Set(session.file_size),
        updated_at: sea_orm::Set(current_time.naive_utc()),
        ..Default::default()
    };
    files::Entity::update(am).exec(&**db).await.map_err(|e| {
        ApiError::InternalServerError(format!("Failed to update file record: {}", e))
    })?;

    Ok((session.file_id.clone(), file_path))
}

/// 完成文件上传
///
/// 当所有块都上传完成后，调用此接口完成文件上传并保存文件信息到数据库
#[utoipa::path(
    post,
    path = "/api/files/upload/complete",
    request_body = FileUploadCompleteRequest,
    responses(
        (status = 200, description = "File uploaded successfully", body = FileUploadCompleteResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Files"
)]
pub async fn complete_file_upload(
    db: web::Data<DatabaseConnection>,
    complete_request: web::Json<FileUploadCompleteRequest>,
) -> Result<HttpResponse, ApiError> {
    let upload_id = &complete_request.upload_id;

    // 获取上传会话
    let session = {
        let sessions = UPLOAD_SESSIONS.lock().unwrap();
        sessions
            .get(upload_id)
            .cloned()
            .ok_or_else(|| ApiError::BadRequest("Invalid upload_id".to_string()))?
    };

    // 检查所有块是否都已上传
    let all_chunks_uploaded = session.uploaded_chunks.iter().all(|&uploaded| uploaded);
    if !all_chunks_uploaded {
        return Err(ApiError::BadRequest(
            "Not all chunks have been uploaded".to_string(),
        ));
    }

    // 合并文件块到指定目录与命名规则
    let task_id_dir = session.task_id.clone().unwrap_or_default();
    let base_dir = if task_id_dir.is_empty() {
        "./uploads".to_string()
    } else {
        format!("./uploads/{}", task_id_dir)
    };
    fs::create_dir_all(&base_dir).await.map_err(|e| {
        ApiError::InternalServerError(format!("Failed to create target directory: {}", e))
    })?;
    let instance_id = session.instance_id.clone().unwrap_or_default();
    let ext = session.file_extension.clone().unwrap_or_default();
    let final_name = if !ext.is_empty() {
        format!("{}_{}.{}", instance_id, session.file_name, ext)
    } else {
        format!("{}_{}", instance_id, session.file_name)
    };
    let file_path = format!("{}/{}", base_dir, final_name);
    let mut file = fs::File::create(&file_path)
        .await
        .map_err(|e| ApiError::InternalServerError(format!("Failed to create file: {}", e)))?;

    for i in 0..session.total_chunks {
        let chunk_file_path = format!("{}_{}.chunk", session.file_path, i);
        let mut chunk = fs::File::open(&chunk_file_path).await.map_err(|e| {
            ApiError::InternalServerError(format!("Failed to open chunk {}: {}", i, e))
        })?;
        let mut buf = vec![0u8; 1024 * 1024];
        loop {
            let n = chunk.read(&mut buf).await.map_err(|e| {
                ApiError::InternalServerError(format!("Failed to read chunk {}: {}", i, e))
            })?;
            if n == 0 {
                break;
            }
            file.write_all(&buf[..n]).await.map_err(|e| {
                ApiError::InternalServerError(format!("Failed to write chunk {}: {}", i, e))
            })?;
        }

        // 删除临时块文件
        let _ = fs::remove_file(&chunk_file_path).await;
    }

    // 删除上传会话
    {
        let mut sessions = UPLOAD_SESSIONS.lock().unwrap();
        sessions.remove(upload_id);
    }

    // 更新文件信息到数据库（使用 init 阶段创建的记录）
    let current_time = Utc::now();
    let am = files::ActiveModel {
        id: sea_orm::Set(session.file_id.clone()),
        file_path: sea_orm::Set(file_path.clone()),
        file_size: sea_orm::Set(session.file_size),
        updated_at: sea_orm::Set(current_time.naive_utc()),
        ..Default::default()
    };
    files::Entity::update(am).exec(&**db).await.map_err(|e| {
        ApiError::InternalServerError(format!("Failed to update file record: {}", e))
    })?;

    Ok(HttpResponse::Ok().json(FileUploadCompleteResponse {
        file_id: session.file_id.clone(),
        file_path,
        message: "File uploaded successfully".to_string(),
    }))
}

/// 检查上传状态
///
/// 检查指定upload_id的文件上传状态
#[utoipa::path(
    get,
    path = "/api/files/upload/status/{upload_id}",
    params(
        ("upload_id" = String, Path, description = "Upload session ID")
    ),
    responses(
        (status = 200, description = "Upload status", body = UploadStatusResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Files"
)]
pub async fn check_upload_status(
    _db: web::Data<DatabaseConnection>,
    upload_id: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let upload_id = upload_id.into_inner();

    let sessions = UPLOAD_SESSIONS.lock().unwrap();
    let session = sessions
        .get(&upload_id)
        .ok_or_else(|| ApiError::BadRequest("Invalid upload_id".to_string()))?;

    let uploaded_count = session
        .uploaded_chunks
        .iter()
        .filter(|&&uploaded| uploaded)
        .count();

    #[derive(Serialize, ToSchema)]
    struct UploadStatusResponse {
        upload_id: String,
        total_chunks: i64,
        uploaded_chunks: usize,
        completed: bool,
    }

    Ok(HttpResponse::Ok().json(UploadStatusResponse {
        upload_id: session.upload_id.clone(),
        total_chunks: session.total_chunks,
        uploaded_chunks: uploaded_count,
        completed: uploaded_count as i64 == session.total_chunks,
    }))
}

/// 下载文件
///
/// 根据文件ID下载已上传的文件
#[utoipa::path(
    get,
    path = "/api/files/download/{file_id}",
    params(
        ("file_id" = String, Path, description = "File ID")
    ),
    responses(
        (status = 200, description = "File downloaded successfully"),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "File not found"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Files"
)]
pub async fn download_file(
    db: web::Data<DatabaseConnection>,
    req: HttpRequest,
    file_id: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let file_id = file_id.into_inner();

    // 从数据库查询文件信息
    let file_record = files::Entity::find_by_id(file_id)
        .one(&**db)
        .await
        .map_err(|e| {
            ApiError::InternalServerError(format!("Failed to query file from database: {}", e))
        })?
        .ok_or_else(|| ApiError::NotFound("File not found".to_string()))?;

    // 检查文件是否存在
    let file_path = Path::new(&file_record.file_path);
    if !file_path.exists() {
        return Err(ApiError::NotFound("File not found on disk".to_string()));
    }

    // 使用NamedFile直接返回文件
    Ok(actix_files::NamedFile::open(file_path)
        .map_err(|e| ApiError::InternalServerError(format!("Failed to open file: {}", e)))?
        .into_response(&req))
}
