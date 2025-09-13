pub mod database;
pub mod error;
pub mod snowflake;

// 重新导出常用的 Snowflake 函数
pub use snowflake::{generate_snowflake_id, validate_snowflake_id, extract_timestamp_from_id};
