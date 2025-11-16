use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::shared::enums;

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
    pub log_level: Option<enums::LogLevel>,
    pub user_id: Option<String>,
    pub keyword: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub source: Option<enums::LogSource>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub log_type: Option<enums::LogType>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_instance_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub instance_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Log {
    pub id: String,
    pub log_level: enums::LogLevel, // 与数据库字段一致
    pub log_source: enums::LogSource, // 与数据库字段一致
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
    pub log_level: enums::LogLevel,
    pub user_id: String,
    pub action: String,
    pub ip_address: String,
    pub user_agent: String,
    pub log_source: enums::LogSource,
    pub timestamp: String,
    pub created_at: String,
    pub updated_at: String,
    // 追加字段，便于前端请求日志展示
    pub method: Option<String>,
    pub path: Option<String>,
    pub status: Option<i32>,
    pub request_headers: Option<serde_json::Value>,
    pub request_body: Option<serde_json::Value>,
    pub response_body: Option<serde_json::Value>,
    pub duration_ms: Option<i64>,
    pub trace_id: Option<String>,
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
