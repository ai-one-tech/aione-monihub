use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub id: String,
    pub code: String,
    pub environment: String,
    pub name: String,
    pub type_: String, // Renamed from 'type' as it's a reserved keyword
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

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigResponse {
    pub id: String,
    pub code: String,
    pub environment: String,
    pub name: String,
    pub type_: String,
    pub content: String,
    pub description: String,
    pub version: u32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigCreateRequest {
    pub code: String,
    pub environment: String,
    pub name: String,
    pub type_: String,
    pub content: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigUpdateRequest {
    pub code: String,
    pub environment: String,
    pub name: String,
    pub type_: String,
    pub content: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigListResponse {
    pub data: Vec<ConfigResponse>,
    pub pagination: Pagination,
    pub timestamp: u64,
    pub trace_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Pagination {
    pub page: u32,
    pub limit: u32,
    pub total: u32,
}

// Query parameters for config list
#[derive(Debug, Deserialize)]
pub struct ConfigListQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
    pub type_: Option<String>,
    pub environment: Option<String>,
    pub all_versions: Option<bool>,
}