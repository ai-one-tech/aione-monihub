use actix_web::{HttpResponse, ResponseError};
use derive_more::Display;

// Custom error type for our application
#[derive(Debug, Display)]
pub enum ApiError {
    #[display(fmt = "Internal server error")]
    InternalServerError,
    
    #[display(fmt = "Bad request")]
    BadRequest,
    
    #[display(fmt = "Unauthorized")]
    Unauthorized,
    
    #[display(fmt = "Forbidden")]
    Forbidden,
    
    #[display(fmt = "Not found")]
    NotFound,
    
    #[display(fmt = "Database error: {}", _0)]
    DatabaseError(String),
    
    #[display(fmt = "Validation error: {}", _0)]
    ValidationError(String),
}

// Implement ResponseError trait for our custom error type
impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ApiError::InternalServerError => {
                HttpResponse::InternalServerError().json("Internal server error")
            }
            ApiError::BadRequest => {
                HttpResponse::BadRequest().json("Bad request")
            }
            ApiError::Unauthorized => {
                HttpResponse::Unauthorized().json("Unauthorized")
            }
            ApiError::Forbidden => {
                HttpResponse::Forbidden().json("Forbidden")
            }
            ApiError::NotFound => {
                HttpResponse::NotFound().json("Not found")
            }
            ApiError::DatabaseError(msg) => {
                HttpResponse::InternalServerError().json(format!("Database error: {}", msg))
            }
            ApiError::ValidationError(msg) => {
                HttpResponse::BadRequest().json(format!("Validation error: {}", msg))
            }
        }
    }
}

// Implement From<rusqlite::Error> for our custom error type
impl From<rusqlite::Error> for ApiError {
    fn from(error: rusqlite::Error) -> Self {
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