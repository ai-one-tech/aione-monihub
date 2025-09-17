use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Role {
    pub id: String,
    pub name: String,
    pub description: String,
    pub permissions: Vec<String>,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct RoleResponse {
    pub id: String,
    pub name: String,
    pub description: String,
    pub permissions: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct RoleCreateRequest {
    pub name: String,
    pub description: String,
    pub permissions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct RoleUpdateRequest {
    pub name: String,
    pub description: String,
    pub permissions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct RoleListResponse {
    pub data: Vec<RoleResponse>,
    pub timestamp: u64,
    pub trace_id: String,
}
