use crate::shared::enums::{AgentType, OsType};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use crate::shared::enums;
// ===================================================================
// 实例信息上报请求/响应模型
// ===================================================================

/// 实例信息上报请求
#[derive(Debug, Serialize, Deserialize)]
pub struct InstanceReportRequest {
    pub instance_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub program_path: Option<String>,
    pub profiles: Option<String>,
    pub agent_type: AgentType,
    pub agent_version: Option<String>,
    pub application_code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub environment: Option<JsonValue>,
    pub system_info: SystemInfo,
    pub network_info: NetworkInfo,
    pub hardware_info: HardwareInfo,
    pub runtime_info: RuntimeInfo,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_fields: Option<JsonValue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_metrics: Option<JsonValue>,
    pub report_timestamp: String, // ISO 8601 format
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_logs: Option<Vec<AgentLogItem>>,
}

/// 系统信息
#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os_type: OsType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub os_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hostname: Option<String>,
}

/// 网络信息
#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub public_ip: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mac_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub network_type: Option<String>, // 支持多枚举值
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<i32>,
}

/// 硬件信息
#[derive(Debug, Serialize, Deserialize)]
pub struct HardwareInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cpu_model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cpu_cores: Option<i32>,
    pub cpu_usage_percent: f64,
    pub memory_total_mb: i64,
    pub memory_used_mb: i64,
    pub memory_usage_percent: f64,
    pub disk_total_gb: i64,
    pub disk_used_gb: i64,
    pub disk_usage_percent: f64,
}

/// 运行时信息
#[derive(Debug, Serialize, Deserialize)]
pub struct RuntimeInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub process_id: Option<i32>,
    pub process_uptime_seconds: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thread_count: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentLogItem {
    pub log_level: enums::LogLevel,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<JsonValue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<String>,
}

/// 实例信息上报响应
#[derive(Debug, Serialize, Deserialize)]
pub struct InstanceReportResponse {
    pub status: String,
    pub message: String,
    pub record_id: String,
    pub timestamp: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub log_success_count: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub log_failure_count: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_config: Option<JsonValue>,
}

// ===================================================================
// 实例上报历史查询模型
// ===================================================================

/// 实例上报记录响应
#[derive(Debug, Serialize, Deserialize)]
pub struct InstanceRecordResponse {
    pub id: String,
    pub instance_id: String,
    pub agent_type: AgentType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_version: Option<String>,

    // 系统信息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub os_type: Option<OsType>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub os_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hostname: Option<String>,

    // 网络信息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub public_ip: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mac_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub network_type: Option<String>,

    // 硬件资源信息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cpu_model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cpu_cores: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cpu_usage_percent: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub memory_total_mb: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub memory_used_mb: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub memory_usage_percent: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disk_total_gb: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disk_used_gb: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disk_usage_percent: Option<String>,

    // 运行状态
    #[serde(skip_serializing_if = "Option::is_none")]
    pub process_id: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub process_uptime_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thread_count: Option<i32>,

    // 扩展信息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_metrics: Option<JsonValue>,

    pub report_timestamp: String,
    pub received_at: String,
    pub created_at: String,
}

/// 实例上报记录列表响应
#[derive(Debug, Serialize, Deserialize)]
pub struct InstanceRecordListResponse {
    pub data: Vec<InstanceRecordResponse>,
    pub pagination: Pagination,
    pub timestamp: u64,
    pub trace_id: String,
}

/// 分页信息
#[derive(Debug, Serialize, Deserialize)]
pub struct Pagination {
    pub page: u32,
    pub limit: u32,
    pub total: u32,
}

/// 查询参数
#[derive(Debug, Deserialize)]
pub struct InstanceRecordListQuery {
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

// ===================================================================
// 数据库实体与API模型转换
// ===================================================================

impl InstanceRecordResponse {
    pub fn from_entity(entity: crate::entities::instance_records::Model) -> Self {
        Self {
            id: entity.id,
            instance_id: entity.instance_id,
            agent_type: entity.agent_type,
            agent_version: entity.agent_version,
            os_type: entity.os_type,
            os_version: entity.os_version,
            hostname: entity.hostname,
            ip_address: entity.ip_address,
            public_ip: entity.public_ip,
            mac_address: entity.mac_address,
            network_type: entity.network_type,
            cpu_model: entity.cpu_model,
            cpu_cores: entity.cpu_cores,
            cpu_usage_percent: entity.cpu_usage_percent.map(|v| v.to_string()),
            memory_total_mb: entity.memory_total_mb,
            memory_used_mb: entity.memory_used_mb,
            memory_usage_percent: entity.memory_usage_percent.map(|v| v.to_string()),
            disk_total_gb: entity.disk_total_gb,
            disk_used_gb: entity.disk_used_gb,
            disk_usage_percent: entity.disk_usage_percent.map(|v| v.to_string()),
            process_id: entity.process_id,
            process_uptime_seconds: entity.process_uptime_seconds,
            thread_count: entity.thread_count,
            custom_metrics: entity.custom_metrics,
            report_timestamp: entity.report_timestamp.to_rfc3339(),
            received_at: entity.received_at.to_rfc3339(),
            created_at: entity.created_at.to_rfc3339(),
        }
    }
}

