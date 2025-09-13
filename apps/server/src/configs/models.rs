use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Config {
    pub id: String,
    pub code: String,
    pub environment: String,
    pub name: String,
    pub config_type: String, // 使用与数据库一致的字段名
    pub content: String,
    pub description: String,
    pub version: i32,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ConfigResponse {
    pub id: String,
    pub code: String,
    pub environment: String,
    pub name: String,
    pub config_type: String,
    pub content: String,
    pub description: String,
    pub version: u32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ConfigCreateRequest {
    pub code: String,
    pub environment: String,
    pub name: String,
    pub config_type: String,
    pub content: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ConfigUpdateRequest {
    pub code: String,
    pub environment: String,
    pub name: String,
    pub config_type: String,
    pub content: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ConfigListResponse {
    pub data: Vec<ConfigResponse>,
    pub pagination: Pagination,
    pub timestamp: u64,
    pub trace_id: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Pagination {
    pub page: u32,
    pub limit: u32,
    pub total: u32,
}

// Query parameters for config list
#[derive(Debug, Deserialize, IntoParams)]
pub struct ConfigListQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
    pub config_type: Option<String>,
    pub environment: Option<String>,
    pub all_versions: Option<bool>,
}
