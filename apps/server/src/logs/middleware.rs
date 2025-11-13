use actix_web::dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform};
use actix_web::{web, Error};
use futures_util::future::{LocalBoxFuture, Ready};
use futures_util::future::ready;
use std::rc::Rc;
use std::time::Instant;
use sea_orm::ActiveValue::Set;
use sea_orm::ActiveModelTrait;
use serde_json::json;
use crate::shared::snowflake::generate_snowflake_id;
use crate::entities::logs;
use chrono::Utc;
use crate::auth::middleware::get_user_id_from_request_not_throw;

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

        let db_opt = req.app_data::<web::Data<sea_orm::DatabaseConnection>>().cloned();
        let user_id_prefetch = {
            let uid = get_user_id_from_request_not_throw(req.request());
            if uid.is_empty() { None } else { Some(uid) }
        };

        Box::pin(async move {
            let result = service.call(req).await;

            let duration_ms = start.elapsed().as_millis() as i64;

            if let Some(db) = db_opt {
                let mut status_code: i32 = 0;
                let mut log_level = "INFO".to_string();

                match &result {
                    Ok(resp) => {
                        status_code = resp.status().as_u16() as i32;
                        if status_code >= 400 {
                            log_level = "ERROR".to_string();
                        }
                    }
                    Err(_) => {
                        status_code = 500;
                        log_level = "ERROR".to_string();
                    }
                }

                let headers = json!({
                    "content_type": "",
                });

                let query_part = if query.is_empty() { String::new() } else { format!("?{}", query) };
                let message = format!("{} {}{} -> {}", method, path, query_part, status_code);

                let now = Utc::now();

                let context = json!({
                    "method": method,
                    "path": path,
                    "query": query,
                    "ip": ip,
                    "user_agent": user_agent,
                    "status": status_code,
                    "duration_ms": duration_ms,
                    "trace_id": trace_id,
                    "headers": headers,
                });

                let user_id = user_id_prefetch;

                let mut active = logs::ActiveModel {
                    id: Set(generate_snowflake_id()),
                    application_id: Set(user_id),
                    log_level: Set(log_level),
                    message: Set(message),
                    context: Set(Some(context)),
                    log_source: Set(Some("http".to_string())),
                    timestamp: Set(now.into()),
                    created_at: Set(now.into()),
                };

                let _ = active.insert(db.get_ref()).await;
            }

            result
        })
    }
}
