use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

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
    pub timestamp: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogListResponse {
    pub data: Vec<LogResponse>,
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
