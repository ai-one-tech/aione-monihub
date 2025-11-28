use crate::auth::models::{
    Claims, CurrentUserResponse, ForgotPasswordRequest, LoginRequest, LoginResponse,
    ResetPasswordRequest, UserResponse,
};
use crate::entities::users;
use crate::shared::enums::UserStatus;
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use crate::users::UsersModule;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse, Result};
use jsonwebtoken::{encode, EncodingKey, Header};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use std::env;
use std::time::{SystemTime, UNIX_EPOCH};

// JWT secret key from environment variable
fn get_jwt_secret() -> String {
    env::var("JWT_SECRET").unwrap_or_else(|_| "aione_monihub_secret_key".to_string())
}

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
            // 检查用户状态（枚举比较）
            if user.status != UserStatus::Active {
                return Ok(HttpResponse::Unauthorized().json("用户账户已被禁用"));
            }

            // Get user roles
            let roles = users_module
                .get_user_roles(&user.id)
                .await
                .unwrap_or_else(|_| vec![]);

            // Generate JWT token
            let cur = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as usize;
            let exp = cur + (3600 * 24 * 30);
            let claims = Claims {
                sub: user.id.to_string(), // Use actual user ID from database
                exp,                      // Token expires in 30 days
            };

            let jwt_secret = get_jwt_secret();
            let token = encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(jwt_secret.as_ref()),
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
                trace_id: generate_snowflake_id(),
            };

            Ok(HttpResponse::Ok().json(response))
        }
        Ok(None) => {
            // 用户不存在或密码错误
            Ok(HttpResponse::Unauthorized().json("用户名或密码错误"))
        }
        Err(err) => {
            log::error!("Database error during login: {:?}", err);
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
    db: web::Data<DatabaseConnection>,
    forgot_req: web::Json<ForgotPasswordRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 查找用户
    let user = users::Entity::find()
        .filter(users::Column::Email.eq(&forgot_req.email))
        .filter(users::Column::DeletedAt.is_null())
        .one(db.get_ref())
        .await
        .map_err(|_| ApiError::InternalServerError("数据库错误".to_string()))?;

    match user {
        Some(user) => {
            // 生成重置令牌
            let users_module = UsersModule::new(db.get_ref().clone());
            match users_module.create_password_reset_token(&user.id).await {
                Ok(token) => {
                    // 模拟发送邮件（在实际应用中，这里应该调用邮件服务）
                    log::info!(
                        "为用户 {} 发送密码重置邮件，重置令牌: {}",
                        forgot_req.email,
                        token
                    );
                    log::info!(
                        "重置链接: http://localhost:3000/reset-password?token={}",
                        token
                    );

                    // 审计记录：生成密码重置令牌（不记录令牌明文）
                    let after = serde_json::json!({
                        "user_id": user.id,
                        "event": "create_token",
                        "email": forgot_req.email,
                    });
                    let _ = crate::shared::request_context::record_audit_log_simple(
                        db.get_ref(),
                        "password_reset_tokens",
                        "create",
                        &req,
                        None,
                        Some(after),
                    )
                    .await;

                    Ok(HttpResponse::Ok().json("密码重置邮件已发送"))
                }
                Err(err) => {
                    log::error!("生成重置令牌失败: {:?}", err);
                    Err(ApiError::InternalServerError(
                        "生成重置令牌失败".to_string(),
                    ))
                }
            }
        }
        None => {
            // 为了安全考虑，即使用户不存在也返回成功信息
            Ok(HttpResponse::Ok().json("如果该邮箱存在，密码重置邮件已发送"))
        }
    }
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
pub async fn reset_password(
    db: web::Data<DatabaseConnection>,
    reset_req: web::Json<ResetPasswordRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 验证令牌
    if reset_req.token.is_empty() {
        return Err(ApiError::BadRequest("无效的令牌".to_string()));
    }

    // 验证密码长度
    if reset_req.new_password.len() < 6 {
        return Err(ApiError::BadRequest("密码长度不能少于6位".to_string()));
    }

    let users_module = UsersModule::new(db.get_ref().clone());

    // 验证并使用重置令牌
    match users_module
        .verify_and_use_reset_token(&reset_req.token)
        .await
    {
        Ok(Some(user_id)) => {
            // 令牌有效，更新用户密码
            match users_module
                .update_user_password(&user_id, &reset_req.new_password)
                .await
            {
                Ok(()) => {
                    log::info!("用户 {} 密码重置成功", user_id);
                    // 审计记录：核销密码重置令牌
                    let before = serde_json::json!({
                        "user_id": user_id,
                        "event": "use_token",
                    });
                    let _ = crate::shared::request_context::record_audit_log_simple(
                        db.get_ref(),
                        "password_reset_tokens",
                        "delete",
                        &req,
                        Some(before),
                        None,
                    )
                    .await;
                    Ok(HttpResponse::Ok().json("密码重置成功"))
                }
                Err(err) => {
                    log::error!("更新密码失败: {:?}", err);
                    Err(ApiError::InternalServerError("更新密码失败".to_string()))
                }
            }
        }
        Ok(None) => {
            // 令牌无效、已使用或已过期
            Err(ApiError::BadRequest("无效的或已过期的令牌".to_string()))
        }
        Err(err) => {
            log::error!("验证重置令牌失败: {:?}", err);
            Err(ApiError::InternalServerError("验证令牌失败".to_string()))
        }
    }
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
pub async fn validate_token(req: HttpRequest) -> Result<HttpResponse, ApiError> {
    // Get user ID from request extension (set by middleware)
    match super::middleware::get_user_id_from_request(&req) {
        Ok(user_id) => {
            // User is authenticated
            log::info!("Token is valid for user ID: {}", user_id);
            Ok(HttpResponse::Ok().json("Token is valid"))
        }
        Err(e) => {
            // User is not authenticated
            Err(e)
        }
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
    // Get user ID from request extension (set by middleware)
    let user_id = super::middleware::get_user_id_from_request(&req)?;

    // Fetch user data from database
    let users_module = UsersModule::new(db.get_ref().clone());

    match users_module.find_user_by_id(&user_id).await {
        Ok(Some(user)) => {
            // Get user roles
            let roles = match users_module.get_user_roles(&user.id).await {
                Ok(roles) => roles,
                Err(_) => vec![],
            };

            // Get token expiration from request extension
            let extensions = req.extensions();
            let claims = extensions.get::<Claims>().unwrap(); // Safe to unwrap as we already verified auth

            let user_response = CurrentUserResponse {
                id: user.id.to_string(),
                username: user.username,
                email: user.email,
                roles,
                exp: claims.exp,
            };
            Ok(HttpResponse::Ok().json(user_response))
        }
        Ok(None) => Ok(HttpResponse::NotFound().json("User not found")),
        Err(err) => {
            log::error!("Database error: {:?}", err);
            Ok(HttpResponse::InternalServerError().json("Database error"))
        }
    }
}
