use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    Error, HttpMessage, HttpRequest,
};
use futures_util::future::{ready, LocalBoxFuture, Ready};
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use std::rc::Rc;
use std::env;

use crate::auth::models::Claims;
use crate::shared::error::ApiError;

// JWT secret key from environment variable
fn get_jwt_secret() -> String {
    env::var("JWT_SECRET").unwrap_or_else(|_| "aione_monihub_secret_key".to_string())
}

pub struct AuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddlewareService {
            service: Rc::new(service),
        }))
    }
}

pub struct AuthMiddlewareService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();

        Box::pin(async move {
            let path = req.path();

            // 允许的公开路径（不需要认证）
            let public_paths = vec![
                "/api/auth/login",
                "/api/auth/forgot-password",
                "/api/auth/reset-password",
                "/health",
                "/swagger-ui",
                "/api-docs",
            ];

            // 检查是否是公开路径
            let is_public = public_paths
                .iter()
                .any(|public_path| path.starts_with(public_path));

            if is_public {
                // 公开路径，直接放行
                return service.call(req).await;
            }

            // 需要认证的路径，检查JWT token
            if let Some(auth_header) = req.headers().get("Authorization") {
                if let Ok(auth_str) = auth_header.to_str() {
                    if auth_str.starts_with("Bearer ") {
                        let token = &auth_str[7..]; // Remove "Bearer " prefix

                        // 验证token
                        let validation = Validation::new(Algorithm::HS256);
                        let jwt_secret = get_jwt_secret();
                        match decode::<Claims>(
                            token,
                            &DecodingKey::from_secret(jwt_secret.as_ref()),
                            &validation,
                        ) {
                            Ok(token_data) => {
                                // Token有效，将用户信息添加到请求扩展中
                                req.extensions_mut().insert(token_data.claims);
                                return service.call(req).await;
                            }
                            Err(err) => {
                                log::warn!("Invalid JWT token: {:?}", err);
                            }
                        }
                    }
                }
            }

            // 认证失败，返回401错误
            Err(ErrorUnauthorized("Valid authentication token required"))
        })
    }
}

/// 从HTTP请求中获取当前登录用户的ID
pub fn get_user_id_from_request(req: &HttpRequest) -> Result<String, ApiError> {
    let extensions = req.extensions();
    let claims = extensions
        .get::<Claims>()
        .ok_or_else(|| ApiError::Unauthorized("User not authenticated".to_string()))?;

    Ok(claims.sub.clone())
}
