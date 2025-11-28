use actix_web::HttpMessage;
use actix_web::HttpRequest;
use sea_orm::DatabaseConnection;
use std::cell::RefCell;

/// 请求上下文信息
#[derive(Debug, Clone)]
pub struct RequestContext {
    pub trace_id: String,
    pub client_ip: String,
    pub user_id: Option<String>,
    pub user_agent: String,
    pub method: String,
    pub path: String,
}

impl Default for RequestContext {
    fn default() -> Self {
        Self {
            trace_id: String::new(),
            client_ip: String::new(),
            user_id: None,
            user_agent: String::new(),
            method: String::new(),
            path: String::new(),
        }
    }
}

// 使用 tokio task_local 来存储请求上下文
tokio::task_local! {
    pub static REQUEST_CONTEXT: RefCell<RequestContext>;
}

/// 在任意地方获取当前请求的 trace_id
///
/// # Example
/// ```
/// use aione_monihub_server::shared::request_context;
///
/// async fn some_function() {
///     let trace_id = request_context::get_trace_id();
///     println!("Current trace_id: {}", trace_id);
/// }
/// ```
pub fn get_trace_id() -> String {
    REQUEST_CONTEXT
        .try_with(|ctx| ctx.borrow().trace_id.clone())
        .unwrap_or_default()
}

/// 在任意地方获取当前请求的客户端IP
pub fn get_client_ip() -> String {
    REQUEST_CONTEXT
        .try_with(|ctx| ctx.borrow().client_ip.clone())
        .unwrap_or_default()
}

/// 在任意地方获取当前请求的用户ID
pub fn get_user_id() -> Option<String> {
    REQUEST_CONTEXT
        .try_with(|ctx| ctx.borrow().user_id.clone())
        .unwrap_or(None)
}

/// 在任意地方获取当前请求的 user_agent
pub fn get_user_agent() -> String {
    REQUEST_CONTEXT
        .try_with(|ctx| ctx.borrow().user_agent.clone())
        .unwrap_or_default()
}

/// 在任意地方获取当前请求的 HTTP 方法
pub fn get_method() -> String {
    REQUEST_CONTEXT
        .try_with(|ctx| ctx.borrow().method.clone())
        .unwrap_or_default()
}

/// 在任意地方获取当前请求的路径
pub fn get_path() -> String {
    REQUEST_CONTEXT
        .try_with(|ctx| ctx.borrow().path.clone())
        .unwrap_or_default()
}

/// 获取完整的请求上下文
pub fn get_context() -> RequestContext {
    REQUEST_CONTEXT
        .try_with(|ctx| ctx.borrow().clone())
        .unwrap_or_default()
}

/// 设置请求上下文（仅供中间件使用）
pub fn set_context(ctx: RequestContext) {
    REQUEST_CONTEXT
        .try_with(|cell| {
            *cell.borrow_mut() = ctx;
        })
        .ok();
}

/// 使用 actix_web::HttpRequest 创建请求上下文
pub fn from_http_request(req: &actix_web::HttpRequest) -> RequestContext {
    let trace_id = get_trace_id_from_request(req);
    let client_ip = get_client_ip_from_request(req);
    let user_id = get_user_id_from_request_optional(req);

    let user_agent = req
        .headers()
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();

    let method = req.method().to_string();
    let path = req.path().to_string();

    RequestContext {
        trace_id,
        client_ip,
        user_id,
        user_agent,
        method,
        path,
    }
}

pub struct TraceIdExt(pub String);

pub fn get_trace_id_from_request(req: &HttpRequest) -> String {
    if let Some(t) = req.extensions().get::<TraceIdExt>() {
        return t.0.clone();
    }
    req.headers()
        .get("x-trace-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string()
    // 尝试从 query param 获取
    // req.query_string()
}

pub fn get_client_ip_from_request(req: &HttpRequest) -> String {
    let ci = req.connection_info();
    ci.realip_remote_addr().unwrap_or("").to_string()
}

pub fn get_user_id_from_request_optional(req: &HttpRequest) -> Option<String> {
    let uid = crate::auth::middleware::get_user_id_from_request_not_throw(req);
    if uid.is_empty() {
        None
    } else {
        Some(uid)
    }
}

pub async fn record_audit_log_simple(
    db: &DatabaseConnection,
    table: &str,
    operation: &str,
    req: &HttpRequest,
    before: Option<serde_json::Value>,
    after: Option<serde_json::Value>,
) -> Result<(), sea_orm::DbErr> {
    let user_id = get_user_id_from_request_optional(req).unwrap_or_default();
    let ip = get_client_ip_from_request(req);
    let tid = get_trace_id_from_request(req);
    let trace_opt = if tid.is_empty() {
        None
    } else {
        Some(tid.as_str())
    };
    crate::audit::handlers::record_audit_log(
        db, table, operation, &user_id, &ip, trace_opt, before, after,
    )
    .await
}
