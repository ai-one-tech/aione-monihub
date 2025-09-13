use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

// User response struct
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UserResponse {
    pub id: String,
    pub username: String,
    pub email: String,
    pub roles: Vec<String>,
}

// Login request struct
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

// Login response struct
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserResponse,
    pub timestamp: u64,
    pub trace_id: String,
}

// Forgot password request struct
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

// Reset password request struct
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ResetPasswordRequest {
    pub token: String,
    pub new_password: String,
}

// JWT claims struct
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Claims {
    pub sub: String, // Subject (user ID)
    pub exp: usize,  // Expiration time (as UTC timestamp)
}

// Current user response struct (for /api/auth/me endpoint)
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CurrentUserResponse {
    pub id: String,
    pub username: String,
    pub email: String,
    pub roles: Vec<String>,
    pub exp: usize, // Token expiration time
}