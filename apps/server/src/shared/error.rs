use actix_web::{HttpResponse, ResponseError};
use chrono::Utc;
use derive_more::Display;
use rand::{distributions::Alphanumeric, Rng};
use serde::Serialize;
use std::backtrace::Backtrace;

// 过滤backtrace，只保留项目相关的堆栈帧
fn filter_backtrace(backtrace: &Backtrace) -> String {
    let bt_string = format!("{}", backtrace);
    let lines: Vec<&str> = bt_string
        .lines()
        .filter(|line| {
            // 保留包含项目名称的行
            line.contains("aione_monihub") ||
            // 保留文件路径以 ./src 或 /src 开头的行
            line.contains("./src") ||
            line.contains("/src/") ||
            // 保留行号信息
            line.trim().starts_with("at ")
        })
        .filter(|line| {
            // 排除第三方库
            !line.contains("actix")
                && !line.contains("tokio")
                && !line.contains("sea_orm")
                && !line.contains("sqlx")
                && !line.contains(".cargo/registry")
                && !line.contains("rustc/")
                && !line.contains("/rustlib/")
        })
        .collect();

    if lines.is_empty() {
        "(无项目相关堆栈信息)".to_string()
    } else {
        lines.join("\n")
    }
}

// Error response struct for consistent JSON error formatting
#[derive(Serialize)]
pub struct ErrorResponse {
    pub message: String,
    pub status: u16,
    pub trace_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

// Custom error type for our application
#[derive(Debug, Display)]
pub enum ApiError {
    #[display(fmt = "Internal server error: {}", _0)]
    InternalServerError(String),

    #[display(fmt = "Bad request: {}", _0)]
    BadRequest(String),

    #[display(fmt = "Unauthorized: {}", _0)]
    Unauthorized(String),

    #[display(fmt = "Forbidden: {}", _0)]
    Forbidden(String),

    #[display(fmt = "Not found: {}", _0)]
    NotFound(String),

    #[display(fmt = "Database error: {}", _0)]
    DatabaseError(String),

    #[display(fmt = "Validation error: {}", _0)]
    ValidationError(String),
}

// Implement ResponseError trait for our custom error type
impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ApiError::InternalServerError(msg) => {
                let trace_id: String = format!(
                    "{}-{}",
                    Utc::now().timestamp_millis(),
                    rand::thread_rng()
                        .sample_iter(&Alphanumeric)
                        .take(8)
                        .map(char::from)
                        .collect::<String>()
                );
                // 打印详细错误信息到日志
                let backtrace = Backtrace::capture();
                let filtered_bt = filter_backtrace(&backtrace);
                log::error!(
                    "[{}] Internal Server Error: {}\n项目调用链:\n{}",
                    trace_id,
                    msg,
                    filtered_bt
                );
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 500,
                    trace_id,
                    details: None,
                };
                HttpResponse::InternalServerError()
                    .insert_header(("x-trace-id", body.trace_id.clone()))
                    .json(body)
            }
            ApiError::BadRequest(msg) => {
                let trace_id: String = format!(
                    "{}-{}",
                    Utc::now().timestamp_millis(),
                    rand::thread_rng()
                        .sample_iter(&Alphanumeric)
                        .take(8)
                        .map(char::from)
                        .collect::<String>()
                );
                log::warn!("[{}] Bad Request: {}", trace_id, msg);
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 400,
                    trace_id,
                    details: None,
                };
                HttpResponse::BadRequest()
                    .insert_header(("x-trace-id", body.trace_id.clone()))
                    .json(body)
            }
            ApiError::Unauthorized(msg) => {
                let trace_id: String = format!(
                    "{}-{}",
                    Utc::now().timestamp_millis(),
                    rand::thread_rng()
                        .sample_iter(&Alphanumeric)
                        .take(8)
                        .map(char::from)
                        .collect::<String>()
                );
                log::warn!("[{}] Unauthorized: {}", trace_id, msg);
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 401,
                    trace_id,
                    details: None,
                };
                HttpResponse::Unauthorized()
                    .insert_header(("x-trace-id", body.trace_id.clone()))
                    .json(body)
            }
            ApiError::Forbidden(msg) => {
                let trace_id: String = format!(
                    "{}-{}",
                    Utc::now().timestamp_millis(),
                    rand::thread_rng()
                        .sample_iter(&Alphanumeric)
                        .take(8)
                        .map(char::from)
                        .collect::<String>()
                );
                log::warn!("[{}] Forbidden: {}", trace_id, msg);
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 403,
                    trace_id,
                    details: None,
                };
                HttpResponse::Forbidden()
                    .insert_header(("x-trace-id", body.trace_id.clone()))
                    .json(body)
            }
            ApiError::NotFound(msg) => {
                let trace_id: String = format!(
                    "{}-{}",
                    Utc::now().timestamp_millis(),
                    rand::thread_rng()
                        .sample_iter(&Alphanumeric)
                        .take(8)
                        .map(char::from)
                        .collect::<String>()
                );
                log::warn!("[{}] Not Found: {}", trace_id, msg);
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 404,
                    trace_id,
                    details: None,
                };
                HttpResponse::NotFound()
                    .insert_header(("x-trace-id", body.trace_id.clone()))
                    .json(body)
            }
            ApiError::DatabaseError(msg) => {
                let trace_id: String = format!(
                    "{}-{}",
                    Utc::now().timestamp_millis(),
                    rand::thread_rng()
                        .sample_iter(&Alphanumeric)
                        .take(8)
                        .map(char::from)
                        .collect::<String>()
                );
                // 打印详细的数据库错误信息
                let backtrace = Backtrace::capture();
                let filtered_bt = filter_backtrace(&backtrace);
                log::error!(
                    "[{}] Database Error: {}\n项目调用链:\n{}",
                    trace_id,
                    msg,
                    filtered_bt
                );
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 500,
                    trace_id,
                    details: None,
                };
                HttpResponse::InternalServerError()
                    .insert_header(("x-trace-id", body.trace_id.clone()))
                    .json(body)
            }
            ApiError::ValidationError(msg) => {
                let trace_id: String = format!(
                    "{}-{}",
                    Utc::now().timestamp_millis(),
                    rand::thread_rng()
                        .sample_iter(&Alphanumeric)
                        .take(8)
                        .map(char::from)
                        .collect::<String>()
                );
                log::warn!("[{}] Validation Error: {}", trace_id, msg);
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 400,
                    trace_id,
                    details: None,
                };
                HttpResponse::BadRequest()
                    .insert_header(("x-trace-id", body.trace_id.clone()))
                    .json(body)
            }
        }
    }
}

// Implement From<sea_orm::DbErr> for our custom error type
impl From<sea_orm::DbErr> for ApiError {
    fn from(error: sea_orm::DbErr) -> Self {
        // 打印详细的数据库错误信息
        let backtrace = Backtrace::capture();
        let filtered_bt = filter_backtrace(&backtrace);
        log::error!(
            "Database error occurred: {}\n项目调用链:\n{}",
            error,
            filtered_bt
        );
        ApiError::DatabaseError(error.to_string())
    }
}

#[track_caller]
pub fn db_error_here_with_context<E: std::fmt::Display>(error: E, context: &str) -> ApiError {
    let loc = std::panic::Location::caller();
    ApiError::DatabaseError(format!(
        "{} | at {}:{} | {}",
        error,
        loc.file(),
        loc.line(),
        context
    ))
}

// Implement From<serde_json::Error> for our custom error type
impl From<serde_json::Error> for ApiError {
    fn from(error: serde_json::Error) -> Self {
        ApiError::ValidationError(error.to_string())
    }
}

// Implement From<chrono::ParseError> for our custom error type
impl From<chrono::ParseError> for ApiError {
    fn from(error: chrono::ParseError) -> Self {
        ApiError::ValidationError(error.to_string())
    }
}
