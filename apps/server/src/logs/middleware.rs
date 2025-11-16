use crate::auth::middleware::get_user_id_from_request_not_throw;
use crate::entities::logs;
use crate::shared::enums;
use crate::shared::snowflake::generate_snowflake_id;
use actix_web::dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform};
use actix_web::{web, Error};
use chrono::Utc;
use futures_util::future::ready;
use futures_util::future::{LocalBoxFuture, Ready};
use sea_orm::ActiveModelTrait;
use sea_orm::ActiveValue::Set;
use serde_json::json;
use std::rc::Rc;
use std::time::Instant;

pub struct RequestLoggingMiddleware;

impl<S, B> Transform<S, ServiceRequest> for RequestLoggingMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = RequestLoggingService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(RequestLoggingService {
            service: Rc::new(service),
        }))
    }
}

pub struct RequestLoggingService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for RequestLoggingService<S>
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

        let method = req.method().to_string();
        let path = req.path().to_string();
        let query = req.query_string().to_string();
        let conn_info = req.connection_info().clone();
        let ip = conn_info.realip_remote_addr().unwrap_or("").to_string();
        let user_agent = req
            .headers()
            .get("User-Agent")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_string();
        let trace_id = generate_snowflake_id();
        let start = Instant::now();

        let db_opt = req
            .app_data::<web::Data<sea_orm::DatabaseConnection>>()
            .cloned();
        let user_id_prefetch = {
            let uid = get_user_id_from_request_not_throw(req.request());
            if uid.is_empty() {
                None
            } else {
                Some(uid)
            }
        };

        Box::pin(async move {
            // 收集请求头并脱敏敏感字段
            let mut headers_json = serde_json::Map::new();
            for (k, v) in req.headers().iter() {
                let key = k.as_str().to_ascii_lowercase();
                let val = v.to_str().unwrap_or("");
                let redacted = match key.as_str() {
                    "authorization" | "cookie" | "set-cookie" => "<redacted>",
                    _ => val,
                };
                headers_json.insert(key, serde_json::Value::String(redacted.to_string()));
            }
            let req_content_type = req
                .headers()
                .get("Content-Type")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("")
                .to_string();
            headers_json.insert(
                "content_type".to_string(),
                serde_json::Value::String(req_content_type.clone()),
            );

            let result = service.call(req).await;

            let duration_ms = start.elapsed().as_millis() as i64;

            if let Some(db) = db_opt {
                
                let mut log_level = enums::LogLevel::Info;
                let status_code: i32;
                match &result {
                    Ok(resp) => {
                        status_code = resp.status().as_u16() as i32;
                        if status_code >= 400 {
                            log_level = enums::LogLevel::Error;
                        }
                    }
                    Err(_) => {
                        status_code = 500;
                        log_level = enums::LogLevel::Error;
                    }
                }

                // 捕获响应头与可读响应体（仅JSON/text，限制长度）
                let mut response_body_value: serde_json::Value = serde_json::Value::Null;
                let mut response_content_type = String::new();
                if let Ok(resp) = &result {
                    response_content_type = resp
                        .headers()
                        .get("Content-Type")
                        .and_then(|v| v.to_str().ok())
                        .unwrap_or("")
                        .to_string();
                    // 暂未捕获响应体字节，进行标记
                    if response_content_type.starts_with("application/json") || response_content_type.starts_with("text/") {
                        response_body_value = json!({ "skipped": true, "reason": "capturing_disabled" });
                    } else {
                        response_body_value = json!({ "skipped": true, "reason": "binary" });
                    }
                }

                let query_part = if query.is_empty() {
                    String::new()
                } else {
                    format!("?{}", query)
                };
                let message = format!("{} {}{} -> {}", method, path, query_part, status_code);

                let now = Utc::now();

                let user_id = user_id_prefetch;
                let context = json!({
                    "method": method,
                    "path": path,
                    "query": query,
                    "ip": ip,
                    "user_agent": user_agent,
                    "status": status_code,
                    "duration_ms": duration_ms,
                    "trace_id": trace_id,
                    "request_headers": headers_json,
                    "request_body": { "skipped": true },
                    "response_body": response_body_value,
                    "response_content_type": response_content_type,
                    "user_id": user_id,
                });

                let active = logs::ActiveModel {
                    id: Set(generate_snowflake_id()),
                    application_id: Set(None),
                    instance_id: Set(None),
                    log_level: Set(log_level),
                    message: Set(message),
                    context: Set(Some(context)),
                    log_source: Set(enums::LogSource::Server),
                    log_type: Set(enums::LogType::Request),
                    timestamp: Set(now.into()),
                    created_at: Set(now.into()),
                };

                let _ = active.insert(db.get_ref()).await;
            }

            result
        })
    }
}
