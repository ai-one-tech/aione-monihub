use crate::auth::models::{
    Claims, CurrentUserResponse, ForgotPasswordRequest, LoginRequest, LoginResponse,
    ResetPasswordRequest, UserResponse,
};
use crate::shared::error::ApiError;
use crate::users::UsersModule;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use sea_orm::DatabaseConnection;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

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
pub async fn login(
    login_req: web::Json<LoginRequest>,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    // This is a placeholder implementation

    // Validate credentials (this would normally check against a database)
    if login_req.username.is_empty() || login_req.password.is_empty() {
        return Ok(HttpResponse::BadRequest().json("用户名和密码不能为空"));
    }

    let users_module = UsersModule::new(db.get_ref().clone());

    // 验证用户凭据（用户名和密码）
    match users_module
        .verify_user_credentials(&login_req.username, &login_req.password)
        .await
    {
        Ok(Some(user)) => {
            // 检查用户状态
            if user.status != "active" {
                return Ok(HttpResponse::Unauthorized().json("用户账户已被禁用"));
            }

            // Get user roles
            let roles = match users_module.get_user_roles(&user.id).await {
                Ok(roles) => roles,
                Err(_) => vec![],
            };

            // Generate JWT token
            let claims = Claims {
                sub: user.id.to_string(), // Use actual user ID from database
                exp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs() as usize
                    + 3600, // Token expires in 1 hour
            };

            let token = encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(JWT_SECRET.as_ref()),
            )
            .unwrap();

            let response = LoginResponse {
                token,
                user: UserResponse {
                    id: user.id.to_string(),
                    username: user.username,
                    email: user.email,
                    roles,
                },
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                trace_id: Uuid::new_v4().to_string(),
            };

            Ok(HttpResponse::Ok().json(response))
        }
        Ok(None) => {
            // 用户不存在或密码错误
            Ok(HttpResponse::Unauthorized().json("用户名或密码错误"))
        }
        Err(err) => {
            eprintln!("Database error during login: {:?}", err);
            Ok(HttpResponse::InternalServerError().json("数据库错误"))
        }
    }
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
pub async fn forgot_password(
    _forgot_req: web::Json<ForgotPasswordRequest>,
) -> Result<HttpResponse> {
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
pub async fn get_current_user(
    req: HttpRequest,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
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
                        // Token is valid, fetch user data from database
                        let user_id = &token_data.claims.sub;

                        let users_module = UsersModule::new(db.get_ref().clone());

                        match users_module.find_user_by_id(user_id).await {
                            Ok(Some(user)) => {
                                // Get user roles
                                let roles = match users_module.get_user_roles(&user.id).await {
                                    Ok(roles) => roles,
                                    Err(_) => vec![],
                                };

                                let user_response = CurrentUserResponse {
                                    id: user.id.to_string(),
                                    username: user.username,
                                    email: user.email,
                                    roles,
                                    exp: token_data.claims.exp,
                                };
                                Ok(HttpResponse::Ok().json(user_response))
                            }
                            Ok(None) => Ok(HttpResponse::NotFound().json("User not found")),
                            Err(err) => {
                                eprintln!("Database error: {:?}", err);
                                Ok(HttpResponse::InternalServerError().json("Database error"))
                            }
                        }
                    }
                    Err(err) => {
                        eprintln!("Token validation error: {:?}", err);
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
