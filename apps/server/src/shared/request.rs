use actix_web::HttpRequest;
use actix_web::HttpMessage;
use sea_orm::DatabaseConnection;

pub struct TraceIdExt(pub String);

pub fn get_trace_id(req: &HttpRequest) -> String {
    if let Some(t) = req.extensions().get::<TraceIdExt>() {
        return t.0.clone();
    }
    req
        .headers()
        .get("x-trace-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string()
}

pub fn get_client_ip(req: &HttpRequest) -> String {
    let ci = req.connection_info();
    ci.realip_remote_addr().unwrap_or("").to_string()
}

pub fn get_user_id_optional(req: &HttpRequest) -> Option<String> {
    let uid = crate::auth::middleware::get_user_id_from_request_not_throw(req);
    if uid.is_empty() { None } else { Some(uid) }
}

pub async fn record_audit_log_simple(
    db: &DatabaseConnection,
    table: &str,
    operation: &str,
    req: &HttpRequest,
    before: Option<serde_json::Value>,
    after: Option<serde_json::Value>,
) -> Result<(), sea_orm::DbErr> {
    let user_id = get_user_id_optional(req).unwrap_or_default();
    let ip = get_client_ip(req);
    let tid = get_trace_id(req);
    let trace_opt = if tid.is_empty() { None } else { Some(tid.as_str()) };
    crate::audit::handlers::record_audit_log(
        db,
        table,
        operation,
        &user_id,
        &ip,
        trace_opt,
        before,
        after,
    ).await
}