use enum_display::EnumDisplay;
use serde::{Deserialize, Serialize};
use sea_orm::entity::prelude::*;
use utoipa::ToSchema;
use strum_macros::{EnumIter};

// 统一的枚举定义与数据库/序列化映射

// 通用状态：注意根据模块需求可区分具体状态枚举
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum Status {
    #[sea_orm(string_value = "active")] Active,
    #[sea_orm(string_value = "disabled")] Disabled,
}

// 用户状态
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum UserStatus {
    #[sea_orm(string_value = "active")] Active,
    #[sea_orm(string_value = "disabled")] Disabled,
}

// 实例在线状态
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum OnlineStatus {
    #[sea_orm(string_value = "online")] Online,
    #[sea_orm(string_value = "offline")] Offline,
}

// 任务状态（沿用现有定义）
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    #[sea_orm(string_value = "pending")] Pending,
    #[sea_orm(string_value = "dispatched")] Dispatched,
    #[sea_orm(string_value = "running")] Running,
    #[sea_orm(string_value = "success")] Success,
    #[sea_orm(string_value = "failed")] Failed,
    #[sea_orm(string_value = "timeout")] Timeout,
    #[sea_orm(string_value = "cancelled")] Cancelled,
}

// 任务类型
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
    #[sea_orm(string_value = "shell_exec")] ShellExec,
    #[sea_orm(string_value = "run_code")] RunCode,
    #[sea_orm(string_value = "file_manager")] FileManager,
    #[sea_orm(string_value = "custom_command")] CustomCommand,
    #[sea_orm(string_value = "http_request")] HttpRequest,
}


#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum PermissionType{
    #[sea_orm(string_value = "menu")]
    Menu,
    #[sea_orm(string_value = "page")]
    Page,
    #[sea_orm(string_value = "action")]
    Action,
}

// 权限动作（如需更灵活，可保留字符串类型）
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum PermissionAction {
    #[sea_orm(string_value = "manage")] Manage,
    #[sea_orm(string_value = "create")] Create,
    #[sea_orm(string_value = "read")] Read,
    #[sea_orm(string_value = "update")] Update,
    #[sea_orm(string_value = "delete")] Delete,
    #[sea_orm(string_value = "export")] Export,
    #[sea_orm(string_value = "import")] Import,
}

// 配置类型
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum ConfigType {
    #[sea_orm(string_value = "json")] Json,
    #[sea_orm(string_value = "yaml")] Yaml,
    #[sea_orm(string_value = "env")] Env,
    #[sea_orm(string_value = "properties")] Properties,
}

// 环境
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum Environment {
    #[sea_orm(string_value = "dev")] Dev,
    #[sea_orm(string_value = "test")] Test,
    #[sea_orm(string_value = "staging")] Staging,
    #[sea_orm(string_value = "prod")] Prod,
}

// Agent 类型
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    #[sea_orm(string_value = "java")] Java,
}

// 操作系统类型
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
// 使用小写序列化，避免将 "MacOS" 序列化为 "mac_o_s"
#[serde(rename_all = "snake_case")]
pub enum OsType {
    #[sea_orm(string_value = "linux")] Linux,
    #[sea_orm(string_value = "windows")] Windows,
    #[sea_orm(string_value = "macos")] Macos,
    #[sea_orm(string_value = "unix")] Unix,
    #[sea_orm(string_value = "unknown")] Unknown,
}

// 网络类型
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum NetworkType {
    #[sea_orm(string_value = "wired")] Wired,
    #[sea_orm(string_value = "wifi")] Wifi,
    #[sea_orm(string_value = "cellular")] Cellular,
    #[sea_orm(string_value = "unknown")] Unknown,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum LogSource {
    #[sea_orm(string_value = "server")]
    Server,
    #[sea_orm(string_value = "agent")]
    Agent,
}

#[derive(EnumDisplay, Clone, Debug, PartialEq, Eq, Serialize, Deserialize, DeriveActiveEnum, EnumIter, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum LogLevel {
    #[sea_orm(string_value = "trace")]
    Trace,
    #[sea_orm(string_value = "debug")]
    Debug,
    #[sea_orm(string_value = "info")]
    Info,
    #[sea_orm(string_value = "warn")]
    Warn,
    #[sea_orm(string_value = "error")]
    Error,
    #[sea_orm(string_value = "fatal")]
    Fatal
}

