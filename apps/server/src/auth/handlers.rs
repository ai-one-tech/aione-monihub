use actix_web::{web, HttpResponse, Result, HttpRequest};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey, Algorithm};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use crate::auth::models::{LoginRequest, LoginResponse, UserResponse, ForgotPasswordRequest, ResetPasswordRequest, Claims, CurrentUserResponse};

// JWT secret key (in production, this should be loaded from environment variables)
const JWT_SECRET: &str = "aione_monihub_secret_key";

#[utoipa::path(
    post,
    path = "/api/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = LoginResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Invalid credentials"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Authentication"
)]
pub async fn login(login_req: web::Json<LoginRequest>) -> Result<HttpResponse> {
    // TODO: Implement actual user authentication logic
    // This is a placeholder implementation
    
    // Validate credentials (this would normally check against a database)
    if login_req.username.is_empty() || login_req.password.is_empty() {
        return Ok(HttpResponse::BadRequest().json("Username and password are required"));
    }
    
    // In a real implementation, you would verify the password against the hashed password in the database
    // For now, we'll just check if the username is "admin" and password is "password"
    if login_req.username != "admin" || login_req.password != "password" {
        return Ok(HttpResponse::Unauthorized().json("Invalid credentials"));
    }
    
    // Generate JWT token
    let claims = Claims {
        sub: "user_id".to_string(), // This should be the actual user ID from the database
        exp: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as usize + 3600, // Token expires in 1 hour
    };
    
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET.as_ref()),
    ).unwrap();
    
    let response = LoginResponse {
        token,
        user: UserResponse {
            id: "user_id".to_string(),
            username: login_req.username.clone(),
            email: "user@example.com".to_string(),
            roles: vec!["admin".to_string()],
        },
        timestamp: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: Uuid::new_v4().to_string(),
    };
    
    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    post,
    path = "/api/auth/forgot-password",
    request_body = ForgotPasswordRequest,
    responses(
        (status = 200, description = "Password reset email sent"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Authentication"
)]
pub async fn forgot_password(_forgot_req: web::Json<ForgotPasswordRequest>) -> Result<HttpResponse> {
    // TODO: Implement forgot password logic
    // This would normally send an email with a reset link
    
    Ok(HttpResponse::Ok().json("Password reset email sent"))
}

#[utoipa::path(
    post,
    path = "/api/auth/reset-password",
    request_body = ResetPasswordRequest,
    responses(
        (status = 200, description = "Password reset successful"),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Invalid token"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Authentication"
)]
pub async fn reset_password(_reset_req: web::Json<ResetPasswordRequest>) -> Result<HttpResponse> {
    // TODO: Implement password reset logic
    // This would validate the token and update the user's password
    
    Ok(HttpResponse::Ok().json("Password reset successful"))
}

// Middleware function to validate JWT tokens
#[utoipa::path(
    get,
    path = "/api/auth/validate",
    responses(
        (status = 200, description = "Token is valid"),
        (status = 401, description = "Invalid or missing token"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Authentication"
)]
pub async fn validate_token(req: HttpRequest) -> Result<HttpResponse> {
    // Get the Authorization header
    let auth_header = req.headers().get("Authorization");
    
    if let Some(auth_header) = auth_header {
        if let Ok(auth_str) = auth_header.to_str() {
            // Check if it starts with "Bearer "
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..]; // Remove "Bearer " prefix
                
                // Validate the token
                let validation = Validation::new(Algorithm::HS256);
                match decode::<Claims>(
                    token,
                    &DecodingKey::from_secret(JWT_SECRET.as_ref()),
                    &validation,
                ) {
                    Ok(token_data) => {
                        // Token is valid
                        println!("Token is valid for user ID: {}", token_data.claims.sub);
                        Ok(HttpResponse::Ok().json("Token is valid"))
                    }
                    Err(_) => {
                        // Token is invalid
                        Ok(HttpResponse::Unauthorized().json("Invalid token"))
                    }
                }
            } else {
                Ok(HttpResponse::Unauthorized().json("Invalid authorization header format"))
            }
        } else {
            Ok(HttpResponse::Unauthorized().json("Invalid authorization header"))
        }
    } else {
        Ok(HttpResponse::Unauthorized().json("Missing authorization header"))
    }
}

// Get current user information
#[utoipa::path(
    get,
    path = "/api/auth/me",
    responses(
        (status = 200, description = "Current user information", body = CurrentUserResponse),
        (status = 401, description = "Unauthorized - invalid or missing token"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Authentication"
)]
pub async fn get_current_user(req: HttpRequest) -> Result<HttpResponse> {
    // Get the Authorization header
    let auth_header = req.headers().get("Authorization");
    
    if let Some(auth_header) = auth_header {
        if let Ok(auth_str) = auth_header.to_str() {
            // Check if it starts with "Bearer "
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..]; // Remove "Bearer " prefix
                
                // Validate the token
                let validation = Validation::new(Algorithm::HS256);
                match decode::<Claims>(
                    token,
                    &DecodingKey::from_secret(JWT_SECRET.as_ref()),
                    &validation,
                ) {
                    Ok(token_data) => {
                        // Token is valid, return user information
                        // In a real implementation, you would fetch user data from the database
                        // using token_data.claims.sub (user ID)
                        let user_response = CurrentUserResponse {
                            id: token_data.claims.sub.clone(),
                            username: "admin".to_string(), // This should come from database
                            email: "admin@example.com".to_string(), // This should come from database
                            roles: vec!["admin".to_string()], // This should come from database
                            exp: token_data.claims.exp,
                        };
                        Ok(HttpResponse::Ok().json(user_response))
                    }
                    Err(_) => {
                        // Token is invalid
                        Ok(HttpResponse::Unauthorized().json("Invalid or expired token"))
                    }
                }
            } else {
                Ok(HttpResponse::Unauthorized().json("Invalid authorization header format"))
            }
        } else {
            Ok(HttpResponse::Unauthorized().json("Invalid authorization header"))
        }
    } else {
        Ok(HttpResponse::Unauthorized().json("Missing authorization header"))
    }
}