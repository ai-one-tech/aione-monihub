use crate::deployments::models::{
    DeploymentCreateRequest, DeploymentListQuery, DeploymentListResponse, DeploymentResponse,
    MonitoringDataResponse, NetworkTraffic, Pagination,
};
use crate::entities::deployments::{ActiveModel, Entity as Deployments, Model as DeploymentModel};
use crate::auth::middleware::get_user_id_from_request;
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, QuerySelect, Set,
};
use serde::{Deserialize, Serialize};
use serde_json::{json};

pub async fn get_deployments(
    db: web::Data<DatabaseConnection>,
    query: web::Query<DeploymentListQuery>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证用户身份
    let _user_id = get_user_id_from_request(&req)?;
    
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(10);
    let offset = (page - 1) * limit;

    let mut select = Deployments::find()
        .filter(crate::entities::deployments::Column::DeletedAt.is_null());

    // 搜索过滤
    if let Some(search) = &query.search {
        let search_pattern = format!("%{}%", search);
        select = select.filter(
            crate::entities::deployments::Column::Version
                .like(&search_pattern)
                .or(crate::entities::deployments::Column::Environment.like(&search_pattern)),
        );
    }

    // 应用ID过滤
    if let Some(application_id) = &query.application_id {
        select = select.filter(crate::entities::deployments::Column::ApplicationId.eq(application_id));
    }

    // 状态过滤
    if let Some(status) = &query.status {
        select = select.filter(crate::entities::deployments::Column::Status.eq(status));
    }

    // 按创建时间降序排列
    select = select.order_by_desc(crate::entities::deployments::Column::CreatedAt);

    // 获取总数和分页数据
    let total = select.clone().count(&**db).await?;
    let deployments: Vec<DeploymentModel> = select
        .offset(offset as u64)
        .limit(limit as u64)
        .all(&**db)
        .await?;

    // 转换为响应格式
    let deployment_responses: Vec<DeploymentResponse> = deployments
        .into_iter()
        .map(|deployment| {
            let config = deployment.config.unwrap_or_else(|| json!({}));
            
            DeploymentResponse {
                id: deployment.id,
                application_id: deployment.application_id,
                private_ip: config.get("private_ip").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                public_ip: config.get("public_ip").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                network_interface: config.get("network_interface").and_then(|v| v.as_str()).unwrap_or("eth0").to_string(),
                hostname: config.get("hostname").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                environment_vars: config.get("environment_vars").and_then(|v| v.as_object())
                    .map(|obj| obj.iter().map(|(k, v)| (k.clone(), v.as_str().unwrap_or("").to_string())).collect())
                    .unwrap_or_default(),
                service_port: config.get("service_port").and_then(|v| v.as_u64()).unwrap_or(8080) as u16,
                process_name: config.get("process_name").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                status: deployment.status,
                created_at: deployment.created_at.to_rfc3339(),
                updated_at: deployment.updated_at.to_rfc3339(),
            }
        })
        .collect();

    let response = DeploymentListResponse {
        data: deployment_responses,
        pagination: Pagination {
            page,
            limit,
            total: total as u32,
        },
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: generate_snowflake_id(),
    };

    Ok(HttpResponse::Ok().json(response))
}

pub async fn create_deployment(
    db: web::Data<DatabaseConnection>,
    deployment: web::Json<DeploymentCreateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证用户身份
    let user_id = get_user_id_from_request(&req)?;
    
    // 验证必要字段
    if deployment.application_id.is_empty() {
        return Err(ApiError::BadRequest("应用ID不能为空".to_string()));
    }
    
    if deployment.status.is_empty() {
        return Err(ApiError::BadRequest("状态不能为空".to_string()));
    }
    
    // 生成雪花ID
    let deployment_id = generate_snowflake_id();
    
    // 构建 config JSON，包含运行时信息
    let config = json!({
        "private_ip": deployment.private_ip,
        "public_ip": deployment.public_ip,
        "network_interface": deployment.network_interface,
        "hostname": deployment.hostname,
        "environment_vars": deployment.environment_vars,
        "service_port": deployment.service_port,
        "process_name": deployment.process_name
    });
    
    // 创建部署记录
    let new_deployment = ActiveModel {
        id: Set(deployment_id.clone()),
        application_id: Set(deployment.application_id.clone()),
        version: Set("1.0.0".to_string()), // 默认版本，后续可以从请求中获取
        environment: Set("dev".to_string()), // 默认环境，后续可以从请求中获取
        status: Set(deployment.status.clone()),
        config: Set(Some(config)),
        deployed_by: Set(user_id.to_string()),
        deployed_at: Set(Some(Utc::now().into())),
        created_by: Set(user_id.to_string()),
        updated_by: Set(user_id.to_string()),
        deleted_at: Set(None),
        revision: Set(1),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };
    
    let saved_deployment = new_deployment.insert(&**db).await?;
    
    let response = DeploymentResponse {
        id: saved_deployment.id,
        application_id: saved_deployment.application_id,
        private_ip: deployment.private_ip.clone(),
        public_ip: deployment.public_ip.clone(),
        network_interface: deployment.network_interface.clone(),
        hostname: deployment.hostname.clone(),
        environment_vars: deployment.environment_vars.clone(),
        service_port: deployment.service_port,
        process_name: deployment.process_name.clone(),
        status: saved_deployment.status,
        created_at: saved_deployment.created_at.to_rfc3339(),
        updated_at: saved_deployment.updated_at.to_rfc3339(),
    };
    
    Ok(HttpResponse::Ok().json(response))
}

pub async fn get_deployment(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证用户身份
    let _user_id = get_user_id_from_request(&req)?;
    
    let deployment_id = path.into_inner();
    
    let deployment = Deployments::find_by_id(deployment_id.clone())
        .filter(crate::entities::deployments::Column::DeletedAt.is_null())
        .one(&**db)
        .await?
        .ok_or_else(|| ApiError::NotFound("部署不存在".to_string()))?;
    
    let config = deployment.config.unwrap_or_else(|| json!({}));
    
    let response = DeploymentResponse {
        id: deployment.id,
        application_id: deployment.application_id,
        private_ip: config.get("private_ip").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        public_ip: config.get("public_ip").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        network_interface: config.get("network_interface").and_then(|v| v.as_str()).unwrap_or("eth0").to_string(),
        hostname: config.get("hostname").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        environment_vars: config.get("environment_vars").and_then(|v| v.as_object())
            .map(|obj| obj.iter().map(|(k, v)| (k.clone(), v.as_str().unwrap_or("").to_string())).collect())
            .unwrap_or_default(),
        service_port: config.get("service_port").and_then(|v| v.as_u64()).unwrap_or(8080) as u16,
        process_name: config.get("process_name").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        status: deployment.status,
        created_at: deployment.created_at.to_rfc3339(),
        updated_at: deployment.updated_at.to_rfc3339(),
    };
    
    Ok(HttpResponse::Ok().json(response))
}

pub async fn update_deployment(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    deployment: web::Json<DeploymentCreateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证用户身份
    let user_id = get_user_id_from_request(&req)?;
    
    let deployment_id = path.into_inner();
    
    // 验证必要字段
    if deployment.application_id.is_empty() {
        return Err(ApiError::BadRequest("应用ID不能为空".to_string()));
    }
    
    if deployment.status.is_empty() {
        return Err(ApiError::BadRequest("状态不能为空".to_string()));
    }
    
    // 查找存在的部署
    let existing_deployment = Deployments::find_by_id(deployment_id.clone())
        .filter(crate::entities::deployments::Column::DeletedAt.is_null())
        .one(&**db)
        .await?
        .ok_or_else(|| ApiError::NotFound("部署不存在".to_string()))?;
    
    // 构建更新的 config JSON
    let config = json!({
        "private_ip": deployment.private_ip,
        "public_ip": deployment.public_ip,
        "network_interface": deployment.network_interface,
        "hostname": deployment.hostname,
        "environment_vars": deployment.environment_vars,
        "service_port": deployment.service_port,
        "process_name": deployment.process_name
    });
    
    // 更新部署记录
    let mut active_deployment: ActiveModel = existing_deployment.into();
    active_deployment.application_id = Set(deployment.application_id.clone());
    active_deployment.status = Set(deployment.status.clone());
    active_deployment.config = Set(Some(config));
    active_deployment.updated_by = Set(user_id.to_string());
    active_deployment.updated_at = Set(Utc::now().into());
    active_deployment.revision = Set(active_deployment.revision.unwrap() + 1);
    
    let updated_deployment = active_deployment.update(&**db).await?;
    
    let response = DeploymentResponse {
        id: updated_deployment.id,
        application_id: updated_deployment.application_id,
        private_ip: deployment.private_ip.clone(),
        public_ip: deployment.public_ip.clone(),
        network_interface: deployment.network_interface.clone(),
        hostname: deployment.hostname.clone(),
        environment_vars: deployment.environment_vars.clone(),
        service_port: deployment.service_port,
        process_name: deployment.process_name.clone(),
        status: updated_deployment.status,
        created_at: updated_deployment.created_at.to_rfc3339(),
        updated_at: updated_deployment.updated_at.to_rfc3339(),
    };
    
    Ok(HttpResponse::Ok().json(response))
}

pub async fn delete_deployment(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证用户身份
    let user_id = get_user_id_from_request(&req)?;
    
    let deployment_id = path.into_inner();
    
    // 查找存在的部署
    let existing_deployment = Deployments::find_by_id(deployment_id.clone())
        .filter(crate::entities::deployments::Column::DeletedAt.is_null())
        .one(&**db)
        .await?
        .ok_or_else(|| ApiError::NotFound("部署不存在".to_string()))?;
    
    // 软删除：设置 deleted_at 字段
    let mut active_deployment: ActiveModel = existing_deployment.into();
    active_deployment.deleted_at = Set(Some(Utc::now().into()));
    active_deployment.updated_by = Set(user_id.to_string());
    active_deployment.updated_at = Set(Utc::now().into());
    active_deployment.revision = Set(active_deployment.revision.unwrap() + 1);
    
    active_deployment.update(&**db).await?;
    
    Ok(HttpResponse::Ok().json(json!({
        "message": "部署删除成功",
        "deployment_id": deployment_id,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        "trace_id": generate_snowflake_id()
    })))
}

pub async fn get_deployment_monitoring(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证用户身份
    let _user_id = get_user_id_from_request(&req)?;
    
    let deployment_id = path.into_inner();
    
    // 验证部署是否存在
    let _deployment = Deployments::find_by_id(deployment_id.clone())
        .filter(crate::entities::deployments::Column::DeletedAt.is_null())
        .one(&**db)
        .await?
        .ok_or_else(|| ApiError::NotFound("部署不存在".to_string()))?;
    
    // 模拟监控数据（在实际中，这里应该从监控系统或代理端获取真实数据）
    use rand::Rng;
    let mut rng = rand::thread_rng();
    
    let response = MonitoringDataResponse {
        cpu_usage: rng.gen_range(10.0..80.0),
        memory_usage: rng.gen_range(20.0..90.0),
        disk_usage: rng.gen_range(30.0..95.0),
        network_traffic: NetworkTraffic {
            incoming: rng.gen_range(100.0..5000.0),
            outgoing: rng.gen_range(50.0..2000.0),
        },
        timestamp: Utc::now().to_rfc3339(),
    };
    
    Ok(HttpResponse::Ok().json(response))
}

// File management handlers
#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfoResponse {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub modified_at: String,
    pub is_directory: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileListResponse {
    pub data: Vec<FileInfoResponse>,
    pub timestamp: u64,
    pub trace_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadFileResponse {
    pub message: String,
    pub file_path: String,
    pub timestamp: u64,
    pub trace_id: String,
}

pub async fn get_files(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证用户身份
    let _user_id = get_user_id_from_request(&req)?;
    
    let deployment_id = path.into_inner();
    
    // 验证部署是否存在
    let _deployment = Deployments::find_by_id(deployment_id.clone())
        .filter(crate::entities::deployments::Column::DeletedAt.is_null())
        .one(&**db)
        .await?
        .ok_or_else(|| ApiError::NotFound("部署不存在".to_string()))?;
    
    // 模拟文件列表（在实际中，这里应该通过SSH或代理端从目标机器获取文件列表）
    let files = vec![
        FileInfoResponse {
            name: "app.log".to_string(),
            path: "/var/log/app.log".to_string(),
            size: 2048,
            modified_at: "2024-01-15T10:30:00Z".to_string(),
            is_directory: false,
        },
        FileInfoResponse {
            name: "error.log".to_string(),
            path: "/var/log/error.log".to_string(),
            size: 1024,
            modified_at: "2024-01-15T09:15:00Z".to_string(),
            is_directory: false,
        },
        FileInfoResponse {
            name: "config".to_string(),
            path: "/etc/config".to_string(),
            size: 0,
            modified_at: "2024-01-14T16:20:00Z".to_string(),
            is_directory: true,
        },
        FileInfoResponse {
            name: "uploads".to_string(),
            path: "/var/uploads".to_string(),
            size: 0,
            modified_at: "2024-01-15T08:45:00Z".to_string(),
            is_directory: true,
        },
    ];
    
    let response = FileListResponse {
        data: files,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: generate_snowflake_id(),
    };
    
    Ok(HttpResponse::Ok().json(response))
}

pub async fn upload_file(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证用户身份
    let _user_id = get_user_id_from_request(&req)?;
    
    let deployment_id = path.into_inner();
    
    // 验证部署是否存在
    let _deployment = Deployments::find_by_id(deployment_id.clone())
        .filter(crate::entities::deployments::Column::DeletedAt.is_null())
        .one(&**db)
        .await?
        .ok_or_else(|| ApiError::NotFound("部署不存在".to_string()))?;
    
    // 模拟文件上传（在实际中，这里应该处理多部分表单数据并上传到目标机器）
    let file_name = format!("upload_{}.txt", generate_snowflake_id());
    let file_path = format!("/deployments/{}/uploads/{}", deployment_id, file_name);
    
    let response = UploadFileResponse {
        message: "文件上传成功".to_string(),
        file_path,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: generate_snowflake_id(),
    };
    
    Ok(HttpResponse::Ok().json(response))
}

pub async fn download_file(
    db: web::Data<DatabaseConnection>,
    path: web::Path<(String, String)>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证用户身份
    let _user_id = get_user_id_from_request(&req)?;
    
    let (deployment_id, file_path) = path.into_inner();
    
    // 验证部署是否存在
    let _deployment = Deployments::find_by_id(deployment_id.clone())
        .filter(crate::entities::deployments::Column::DeletedAt.is_null())
        .one(&**db)
        .await?
        .ok_or_else(|| ApiError::NotFound("部署不存在".to_string()))?;
    
    // 验证文件路径（防止路径遍历攻击）
    if file_path.contains("..") || file_path.starts_with('/') {
        return Err(ApiError::BadRequest("非法文件路径".to_string()));
    }
    
    // 提取文件名
    let file_name = file_path.split('/').last().unwrap_or(&file_path);
    
    // 模拟文件内容（在实际中，这里应该从目标机器读取文件内容）
    let file_content = format!("这是文件 {} 的内容\n部署ID: {}\n生成时间: {}", 
                              file_name, deployment_id, Utc::now().to_rfc3339());
    
    Ok(HttpResponse::Ok()
        .content_type("application/octet-stream")
        .append_header((
            "Content-Disposition",
            format!("attachment; filename=\"{}\"", file_name),
        ))
        .body(file_content))
}

pub async fn delete_file(
    db: web::Data<DatabaseConnection>,
    path: web::Path<(String, String)>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证用户身份
    let _user_id = get_user_id_from_request(&req)?;
    
    let (deployment_id, file_path) = path.into_inner();
    
    // 验证部署是否存在
    let _deployment = Deployments::find_by_id(deployment_id.clone())
        .filter(crate::entities::deployments::Column::DeletedAt.is_null())
        .one(&**db)
        .await?
        .ok_or_else(|| ApiError::NotFound("部署不存在".to_string()))?;
    
    // 验证文件路径（防止路径遍历攻击）
    if file_path.contains("..") || file_path.starts_with('/') {
        return Err(ApiError::BadRequest("非法文件路径".to_string()));
    }
    
    // 模拟文件删除（在实际中，这里应该通过SSH或代理端删除目标机器上的文件）
    
    Ok(HttpResponse::Ok().json(json!({
        "message": "文件删除成功",
        "deployment_id": deployment_id,
        "file_path": file_path,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        "trace_id": generate_snowflake_id()
    })))
}
