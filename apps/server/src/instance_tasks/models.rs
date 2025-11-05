use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use utoipa::ToSchema;

// ===================================================================
// 任务类型枚举
// ===================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
    ShellExec,      // Shell命令执行
    InternalCmd,    // 内部命令
    FileUpload,     // 文件上传
    FileDownload,   // 文件下载
    FileBrowse,     // 文件浏览
    FileView,       // 文件查看
    FileDelete,     // 文件删除
}

impl TaskType {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskType::ShellExec => "shell_exec",
            TaskType::InternalCmd => "internal_cmd",
            TaskType::FileUpload => "file_upload",
            TaskType::FileDownload => "file_download",
            TaskType::FileBrowse => "file_browse",
            TaskType::FileView => "file_view",
            TaskType::FileDelete => "file_delete",
        }
    }
}

// ===================================================================
// 任务状态枚举
// ===================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,     // 待下发
    Dispatched,  // 已下发
    Running,     // 执行中
    Success,     // 执行成功
    Failed,      // 执行失败
    Timeout,     // 执行超时
    Cancelled,   // 已取消
}

impl TaskStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskStatus::Pending => "pending",
            TaskStatus::Dispatched => "dispatched",
            TaskStatus::Running => "running",
            TaskStatus::Success => "success",
            TaskStatus::Failed => "failed",
            TaskStatus::Timeout => "timeout",
            TaskStatus::Cancelled => "cancelled",
        }
    }
}

// ===================================================================
// 任务管理请求/响应模型
// ===================================================================

/// 创建任务请求
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct TaskCreateRequest {
    pub task_name: String,
    pub task_type: String,
    pub target_instances: Vec<String>, // 实例ID数组
    pub task_content: JsonValue,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timeout_seconds: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retry_count: Option<i32>,
}

/// 任务响应
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct TaskResponse {
    pub id: String,
    pub task_name: String,
    pub task_type: String,
    pub target_instances: JsonValue,
    pub task_content: JsonValue,
    pub priority: i32,
    pub timeout_seconds: i32,
    pub retry_count: i32,
    pub created_by: String,
    pub created_at: String,
    pub updated_at: String,
}

/// 任务列表响应
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct TaskListResponse {
    pub data: Vec<TaskResponse>,
    pub pagination: Pagination,
    pub timestamp: u64,
    pub trace_id: String,
}

/// 任务列表查询参数
#[derive(Debug, Deserialize)]
pub struct TaskListQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub task_type: Option<String>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
}

// ===================================================================
// 任务执行记录模型
// ===================================================================

/// 任务执行记录响应
#[derive(Debug, Serialize, Deserialize)]
pub struct TaskRecordResponse {
    pub id: String,
    pub task_id: String,
    pub instance_id: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dispatch_time: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_time: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result_code: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result_message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result_data: Option<JsonValue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    pub retry_attempt: i32,
    pub created_at: String,
    pub updated_at: String,
}

/// 任务执行记录列表响应
#[derive(Debug, Serialize, Deserialize)]
pub struct TaskRecordListResponse {
    pub data: Vec<TaskRecordResponse>,
    pub pagination: Pagination,
    pub timestamp: u64,
    pub trace_id: String,
}

/// 任务执行记录查询参数
#[derive(Debug, Deserialize)]
pub struct TaskRecordListQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub status: Option<String>,
}

/// 结果回传请求
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct TaskResultSubmitRequest {
    pub record_id: String,
    pub instance_id: String,
    pub status: String,
    pub result_code: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result_message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result_data: Option<JsonValue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    pub start_time: String, // ISO 8601
    pub end_time: String,   // ISO 8601
    pub duration_ms: i64,
}

/// 结果回传响应
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct TaskResultSubmitResponse {
    pub status: String,
    pub message: String,
    pub timestamp: u64,
}

/// 任务下发响应（Agent拉取）
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct TaskDispatchResponse {
    pub tasks: Vec<TaskDispatchItem>,
    pub timestamp: u64,
}

/// 任务下发项
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct TaskDispatchItem {
    pub task_id: String,
    pub record_id: String,
    pub task_type: String,
    pub task_content: JsonValue,
    pub timeout_seconds: i32,
    pub priority: i32,
}

// ===================================================================
// 分页信息
// ===================================================================

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Pagination {
    pub page: u32,
    pub limit: u32,
    pub total: u32,
}

// ===================================================================
// 数据库实体与API模型转换
// ===================================================================

impl TaskResponse {
    pub fn from_entity(entity: crate::entities::instance_tasks::Model) -> Self {
        Self {
            id: entity.id,
            task_name: entity.task_name,
            task_type: entity.task_type,
            target_instances: entity.target_instances,
            task_content: entity.task_content,
            priority: entity.priority.unwrap_or(5),
            timeout_seconds: entity.timeout_seconds.unwrap_or(300),
            retry_count: entity.retry_count.unwrap_or(0),
            created_by: entity.created_by,
            created_at: entity.created_at.to_rfc3339(),
            updated_at: entity.updated_at.to_rfc3339(),
        }
    }
}

impl TaskRecordResponse {
    pub fn from_entity(entity: crate::entities::instance_task_records::Model) -> Self {
        Self {
            id: entity.id,
            task_id: entity.task_id,
            instance_id: entity.instance_id,
            status: entity.status,
            dispatch_time: entity.dispatch_time.map(|t| t.to_rfc3339()),
            start_time: entity.start_time.map(|t| t.to_rfc3339()),
            end_time: entity.end_time.map(|t| t.to_rfc3339()),
            duration_ms: entity.duration_ms,
            result_code: entity.result_code,
            result_message: entity.result_message,
            result_data: entity.result_data,
            error_message: entity.error_message,
            retry_attempt: entity.retry_attempt.unwrap_or(0),
            created_at: entity.created_at.to_rfc3339(),
            updated_at: entity.updated_at.to_rfc3339(),
        }
    }
}
