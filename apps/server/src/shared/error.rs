use actix_web::{HttpResponse, ResponseError};
use derive_more::Display;
use serde::Serialize;
use rand::{distributions::Alphanumeric, Rng};
use chrono::Utc;

// Error response struct for consistent JSON error formatting
#[derive(Serialize)]
pub struct ErrorResponse {
    pub message: String,
    pub status: u16,
    pub trace_id: String,
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
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 500,
                    trace_id,
                };
                HttpResponse::InternalServerError().json(body)
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
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 400,
                    trace_id,
                };
                HttpResponse::BadRequest().json(body)
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
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 401,
                    trace_id,
                };
                HttpResponse::Unauthorized().json(body)
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
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 403,
                    trace_id,
                };
                HttpResponse::Forbidden().json(body)
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
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 404,
                    trace_id,
                };
                HttpResponse::NotFound().json(body)
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
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 500,
                    trace_id,
                };
                HttpResponse::InternalServerError().json(body)
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
                let body = ErrorResponse {
                    message: msg.clone(),
                    status: 400,
                    trace_id,
                };
                HttpResponse::BadRequest().json(body)
            }
        }
    }
}

// Implement From<sea_orm::DbErr> for our custom error type
impl From<sea_orm::DbErr> for ApiError {
    fn from(error: sea_orm::DbErr) -> Self {
        ApiError::DatabaseError(error.to_string())
    }
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
