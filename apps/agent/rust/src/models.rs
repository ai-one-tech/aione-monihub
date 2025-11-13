use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Clone, Serialize, Deserialize)]
pub struct InstanceReportRequest {
    pub instance_id: String,
    pub system: SystemInfo,
    pub network: NetworkInfo,
    pub hardware: HardwareInfo,
    pub runtime: RuntimeInfo,
    pub custom: serde_json::Value,
    pub logs: Vec<AgentLogItem>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct SystemInfo { pub os_type: String, pub os_version: String, pub hostname: String }

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct NetworkInfo { pub local_ips: Vec<String>, pub mac_addresses: Vec<String>, pub public_ip: Option<String> }

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct HardwareInfo { pub cpu: String, pub total_memory_mb: u64, pub used_memory_mb: u64, pub disks_mb: Vec<(String, u64)> }

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct RuntimeInfo { pub pid: u32, pub uptime_seconds: u64, pub threads: usize, pub exe_path: String, pub env: Vec<(String, String)>, pub profiles: Vec<String> }

#[derive(Clone, Serialize, Deserialize)]
pub struct AgentLogItem { pub id: Uuid, pub level: String, pub message: String, pub ts: DateTime<Utc> }

#[derive(Clone, Serialize, Deserialize)]
pub struct TaskDispatchResponse { pub tasks: Vec<TaskDispatchItem>, pub timestamp: DateTime<Utc> }

#[derive(Clone, Serialize, Deserialize)]
pub struct TaskDispatchItem { pub record_id: String, pub task_type: TaskType, pub timeout_seconds: Option<u64>, pub content: serde_json::Value, pub priority: Option<i32> }

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskType { ShellExec, RunCode, FileManager, CustomCommand }

#[derive(Clone, Serialize, Deserialize)]
pub struct TaskResultSubmitRequest {
    pub record_id: String,
    pub instance_id: String,
    pub status: TaskStatus,
    pub code: i32,
    pub message: String,
    pub data: serde_json::Value,
    pub error: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub duration_ms: u128,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus { Running, Success, Failed, Timeout }

