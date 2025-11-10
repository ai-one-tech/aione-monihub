use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};
use crate::shared::enums::Status;

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Application {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub code: String,
    pub status: Status,
    pub description: String,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ApplicationResponse {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub code: String,
    pub status: Status,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ApplicationCreateRequest {
    pub project_id: String,
    pub name: String,
    pub code: String,
    pub status: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ApplicationUpdateRequest {
    pub project_id: String,
    pub name: String,
    pub code: String,
    pub status: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ApplicationListResponse {
    pub data: Vec<ApplicationResponse>,
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

// Query parameters for application list
#[derive(Debug, Deserialize, IntoParams)]
pub struct ApplicationListQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
    pub project_id: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ApplicationDetail {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub code: String,
    pub status: String,
    pub description: String,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
