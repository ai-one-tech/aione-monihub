use actix_web::{HttpResponse, ResponseError};
use derive_more::Display;

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
                HttpResponse::InternalServerError().json(format!("Internal server error: {}", msg))
            }
            ApiError::BadRequest(msg) => {
                HttpResponse::BadRequest().json(format!("Bad request: {}", msg))
            }
            ApiError::Unauthorized(msg) => {
                HttpResponse::Unauthorized().json(format!("Unauthorized: {}", msg))
            }
            ApiError::Forbidden(msg) => {
                HttpResponse::Forbidden().json(format!("Forbidden: {}", msg))
            }
            ApiError::NotFound(msg) => HttpResponse::NotFound().json(format!("Not found: {}", msg)),
            ApiError::DatabaseError(msg) => {
                HttpResponse::InternalServerError().json(format!("Database error: {}", msg))
            }
            ApiError::ValidationError(msg) => {
                HttpResponse::BadRequest().json(format!("Validation error: {}", msg))
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
