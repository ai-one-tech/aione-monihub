use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize)]
pub struct Permission {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub resource: String,
    pub action: String,
    pub permission_type: String, // menu, action, button, page
    pub menu_path: Option<String>,
    pub menu_icon: Option<String>,
    pub parent_permission_id: Option<String>,
    pub sort_order: Option<i32>,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct PermissionResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub resource: String,
    pub action: String,
    pub permission_type: String,
    pub menu_path: Option<String>,
    pub menu_icon: Option<String>,
    pub parent_permission_id: Option<String>,
    pub sort_order: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct MenuItemResponse {
    pub id: String,
    pub name: String,
    pub title: String, // 菜单显示名称
    pub icon: Option<String>,
    pub path: String,
    pub sort_order: i32,
    pub children: Vec<MenuItemResponse>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UserMenuResponse {
    pub data: Vec<MenuItemResponse>,
    pub timestamp: u64,
    pub trace_id: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct PermissionCreateRequest {
    pub name: String,
    pub description: Option<String>,
    pub resource: String,
    pub action: String,
    pub permission_type: String, // menu, action, button, page
    pub menu_path: Option<String>,
    pub menu_icon: Option<String>,
    pub parent_permission_id: Option<String>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct PermissionUpdateRequest {
    pub name: String,
    pub description: Option<String>,
    pub resource: String,
    pub action: String,
    pub permission_type: String,
    pub menu_path: Option<String>,
    pub menu_icon: Option<String>,
    pub parent_permission_id: Option<String>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PermissionAssignRequest {
    pub role_id: String,
    pub permissions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct PermissionListResponse {
    pub data: Vec<PermissionResponse>,
    pub timestamp: u64,
    pub trace_id: String,
}
