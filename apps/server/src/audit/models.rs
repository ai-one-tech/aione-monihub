use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct AuditLogListQuery {
    pub page: Option<i32>,
    pub limit: Option<i32>,
    pub user: Option<String>,
    pub ip: Option<String>,
    pub trace_id: Option<String>,
    pub table: Option<String>,
    pub operation: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuditLogItem {
    pub id: String,
    pub user: String,
    pub timestamp: String,
    pub ip: String,
    pub trace_id: Option<String>,
    pub table: String,
    pub operation: String,
}

#[derive(Debug, Serialize)]
pub struct ChangeEntry {
    pub path: String,
    pub r#type: String, // added | removed | changed
    pub before: Option<serde_json::Value>,
    pub after: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct AuditLogDetail {
    pub id: String,
    pub user: String,
    pub timestamp: String,
    pub ip: String,
    pub trace_id: Option<String>,
    pub table: String,
    pub operation: String,
    pub before: Option<serde_json::Value>,
    pub after: Option<serde_json::Value>,
    pub diff: Vec<ChangeEntry>,
}

#[derive(Debug, Serialize)]
pub struct Pagination {
    pub page: i32,
    pub limit: i32,
    pub total: u32,
}

#[derive(Debug, Serialize)]
pub struct AuditLogListResponse {
    pub data: Vec<AuditLogItem>,
    pub pagination: Pagination,
    pub timestamp: u64,
    pub trace_id: String,
}
