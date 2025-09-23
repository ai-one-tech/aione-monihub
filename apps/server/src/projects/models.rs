use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub code: String,
    pub status: String,
    pub description: Option<String>,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ProjectResponse {
    pub id: String,
    pub name: String,
    pub code: String,
    pub status: String,
    pub description: String,
    pub created_at: String, // DateTime in ISO 8601 format
    pub updated_at: String, // DateTime in ISO 8601 format
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ProjectCreateRequest {
    pub name: String,
    pub code: String,
    pub status: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ProjectUpdateRequest {
    pub name: String,
    pub code: String,
    pub status: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ProjectListResponse {
    pub data: Vec<ProjectResponse>,
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

// Query parameters for project list
#[derive(Debug, Deserialize, IntoParams)]
pub struct ProjectListQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
    pub status: Option<String>,
}
