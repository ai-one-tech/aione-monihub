pub mod database;
pub mod error;
pub mod enums;
pub mod snowflake;
// 重新导出常用的 Snowflake 函数
pub use snowflake::{generate_snowflake_id, validate_snowflake_id, extract_timestamp_from_id};
pub mod request_context;

pub use request_context::{get_trace_id_from_request, get_client_ip_from_request, get_user_id_from_request_optional, record_audit_log_simple, TraceIdExt};
