/// 数据模型模块
///
/// 定义与服务端交互所需的请求与任务结构，字段命名与 Java Agent 保持一致，
/// 以确保后端能够无差别处理不同语言的 Agent。
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;


#[derive(Clone, Serialize, Deserialize)]
/// 实例信息上报请求体
pub struct InstanceReportRequest {
    #[serde(rename = "agent_instance_id")]
    pub agent_instance_id: String,
    #[serde(rename = "application_code")]
    pub application_code: String,
    #[serde(rename = "agent_type")]
    pub agent_type: String,
    #[serde(rename = "agent_version")]
    pub agent_version: String,
    #[serde(rename = "program_path")]
    pub program_path: String,
    #[serde(rename = "profiles")]
    pub profiles: Option<String>,
    #[serde(rename = "environment")]
    pub environment: serde_json::Value,
    #[serde(rename = "system_info")]
    pub system_info: SystemInfo,
    #[serde(rename = "network_info")]
    pub network_info: NetworkInfo,
    #[serde(rename = "hardware_info")]
    pub hardware_info: HardwareInfo,
    #[serde(rename = "runtime_info")]
    pub runtime_info: RuntimeInfo,
    #[serde(rename = "custom_fields")]
    pub custom_fields: serde_json::Value,
    #[serde(rename = "custom_metrics")]
    pub custom_metrics: serde_json::Value,
    #[serde(rename = "report_timestamp")]
    pub report_timestamp: String,
    #[serde(rename = "agent_logs")]
    pub agent_logs: Vec<AgentLogWire>,
}

#[derive(Clone, Serialize, Deserialize, Default)]
/// 系统信息
pub struct SystemInfo {
    pub os_type: String,
    pub os_version: String,
    pub hostname: String,
}

#[derive(Clone, Serialize, Deserialize, Default)]
/// 网络信息
pub struct NetworkInfo {
    pub ip_address: Option<String>,
    pub mac_address: Option<String>,
    pub public_ip: Option<String>,
    pub network_type: Option<String>,
    pub port: Option<i32>,
}

#[derive(Clone, Serialize, Deserialize, Default)]
/// 硬件信息（与服务端模型对齐）
pub struct HardwareInfo {
    pub cpu_model: Option<String>,
    pub cpu_cores: Option<i32>,
    pub cpu_usage_percent: f64,
    pub memory_total_mb: i64,
    pub memory_used_mb: i64,
    pub memory_usage_percent: f64,
    pub disk_total_gb: i64,
    pub disk_used_gb: i64,
    pub disk_usage_percent: f64,
}

#[derive(Clone, Serialize, Deserialize, Default)]
/// 运行时信息
pub struct RuntimeInfo {
    pub process_id: Option<i32>,
    pub process_uptime_seconds: i64,
    pub thread_count: Option<i32>,
}

#[derive(Clone, Serialize, Deserialize)]
/// Agent 内部日志项（内部缓冲使用）
pub struct AgentLogItem {
    pub id: Uuid,
    pub level: String,
    pub message: String,
    pub ts: DateTime<Utc>,
}

#[derive(Clone, Serialize, Deserialize)]
/// 上报给服务端的日志项（与服务端模型对齐）
pub struct AgentLogWire {
    #[serde(rename = "log_level")]
    pub log_level: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<serde_json::Value>,
    #[serde(rename = "timestamp", skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
/// 任务下发响应体
pub struct TaskDispatchResponse {
    pub tasks: Vec<TaskDispatchItem>,
    pub timestamp: i64,
}

#[derive(Clone, Serialize, Deserialize)]
/// 单个任务项（包含类型与内容）
pub struct TaskDispatchItem {
    pub task_id: String,
    pub record_id: String,
    pub instance_id: String,
    pub task_type: TaskType,
    pub timeout_seconds: u64,
    pub task_content: serde_json::Value,
    pub priority: i32,
}

#[derive(Clone, Serialize, Deserialize)]
/// 任务类型枚举（snake_case 与后端一致）
#[serde(rename_all = "snake_case")]
pub enum TaskType {
    ShellExec,
    RunCode,
    FileManager,
    CustomCommand,
    HttpRequest,
}

#[derive(Clone, Serialize, Deserialize)]
/// 任务结果提交请求体（字段命名与后端保持一致）
pub struct TaskResultSubmitRequest {
    pub record_id: String,
    #[serde(rename = "agent_instance_id")]
    pub instance_id: String,
    #[serde(rename = "status")]
    pub status: TaskStatus,
    #[serde(rename = "result_code")]
    pub code: i32,
    #[serde(rename = "result_message")]
    pub message: String,
    #[serde(rename = "result_data")]
    pub data: serde_json::Value,
    #[serde(rename = "error_message")]
    pub error: Option<String>,
    #[serde(rename = "start_time")]
    pub start_time: DateTime<Utc>,
    #[serde(rename = "end_time")]
    pub end_time: DateTime<Utc>,
    #[serde(rename = "duration_ms")]
    pub duration_ms: u128,
}

#[derive(Clone, Serialize, Deserialize)]
/// 任务状态枚举（snake_case）
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Running,
    Success,
    Failed,
    Timeout,
}
