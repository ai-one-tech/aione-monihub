use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FileUploadRequest {
    pub file_name: String,
    pub is_zip: bool,
    pub file_size: i64,
    pub chunk_size: i64,
    pub total_chunks: i64,
    // 新增可选字段
    pub task_id: Option<String>,
    pub instance_id: Option<String>,
    pub file_extension: Option<String>,
    pub original_file_path: Option<String>,
    pub is_directory: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FileChunkUploadRequest {
    pub upload_id: String,
    pub chunk_index: i64,
    pub chunk_size: i64,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FileUploadResponse {
    pub upload_id: String,
    pub message: String,
    pub download_path: String,
    pub is_directory: bool,
    pub compressed: bool,
    pub final_name: String,
    pub size: i64,
    pub server_file_path: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FileChunkUploadResponse {
    pub upload_id: String,
    pub chunk_index: i64,
    pub message: String,
    pub completed: bool,
    pub file_id: Option<String>,
    pub file_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FileUploadCompleteRequest {
    pub upload_id: String,
    // 新增可选字段
    pub task_id: Option<String>,
    pub instance_id: Option<String>,
    pub file_extension: Option<String>,
    pub original_file_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FileUploadCompleteResponse {
    pub file_id: String,
    pub file_path: String,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FileInfo {
    pub id: String,
    pub file_name: String,
    pub file_size: i64,
    pub file_path: String,
    pub uploaded_at: DateTime<Utc>,
    pub uploaded_by: String,
    // 新增可选字段
    pub task_id: Option<String>,
    pub instance_id: Option<String>,
    pub file_extension: Option<String>,
    pub original_file_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FileListQuery {
    pub task_id: String,
    pub instance_id: String,
    pub order_by: Option<String>,
    pub order: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct FileListResponse {
    pub data: Vec<FileInfo>,
}
