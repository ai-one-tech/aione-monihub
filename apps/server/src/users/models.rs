use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub status: String,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct RoleInfo {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UserResponse {
    pub id: String,
    pub username: String,
    pub email: String,
    pub status: String,
    pub roles: Vec<RoleInfo>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UserCreateRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UserUpdateRequest {
    pub username: String,
    pub email: String,
    pub status: String,
    /// 角色名称列表（可选）。如果提供，将以名称匹配角色并更新用户角色。
    pub roles: Option<Vec<String>>, 
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UserListResponse {
    pub data: Vec<UserResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
    pub timestamp: u64,
    pub trace_id: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UserRoleAssignRequest {
    pub role_ids: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UserRoleResponse {
    pub id: String,
    pub user_id: String,
    pub role_id: String,
    pub role_name: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UserRoleListResponse {
    pub data: Vec<UserRoleResponse>,
    pub timestamp: u64,
    pub trace_id: String,
}

// Query parameters for user list
#[derive(Debug, Deserialize, IntoParams)]
pub struct UserListQuery {
    pub page: Option<u64>,
    pub limit: Option<u64>,
    pub search: Option<String>,
    pub status: Option<String>,
}
