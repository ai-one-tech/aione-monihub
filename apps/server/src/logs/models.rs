use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Pagination {
    pub page: u32,
    pub limit: u32,
    pub total: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogListQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub log_level: Option<String>,
    pub user_id: Option<String>,
    pub keyword: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub source: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Log {
    pub id: String,
    pub log_level: String, // 与数据库字段一致
    pub user_id: String,
    pub action: String,
    pub ip_address: String,
    pub user_agent: String,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub timestamp: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogResponse {
    pub id: String,
    #[serde(rename = "log_level")]
    pub log_level: String,
    pub user_id: String,
    pub action: String,
    pub ip_address: String,
    pub user_agent: String,
    pub log_source: Option<String>,
    pub timestamp: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogListResponse {
    pub data: Vec<LogResponse>,
    pub pagination: Pagination,
    pub timestamp: u64,
    pub trace_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogExportRequest {
    pub start_time: String,
    pub end_time: String,
    pub user_id: Option<String>,
    pub action: Option<String>,
}
