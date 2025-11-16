use actix_web::{web, HttpResponse};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Order};
use sea_orm::PaginatorTrait;
use sea_orm::sea_query::Expr;
use sea_orm::Condition;

use crate::entities::{logs::Column as LogCol, Logs};
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;

use crate::audit::models::{AuditLogListQuery, AuditLogItem, AuditLogListResponse, Pagination, AuditLogDetail, ChangeEntry};

pub async fn get_audit_logs(
    query: web::Query<AuditLogListQuery>,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(10).max(1).min(100);

    let mut qb = Logs::find().filter(LogCol::LogSource.eq(crate::shared::enums::LogSource::Audit));

    if let Some(user) = &query.user { let expr = Expr::cust(format!("(context ->> 'user_id') = '{}'", user)); qb = qb.filter(Condition::all().add(expr)); }
    if let Some(ip) = &query.ip { let expr = Expr::cust(format!("(context ->> 'ip') = '{}'", ip)); qb = qb.filter(Condition::all().add(expr)); }
    if let Some(trace_id) = &query.trace_id { let expr = Expr::cust(format!("(context ->> 'trace_id') = '{}'", trace_id)); qb = qb.filter(Condition::all().add(expr)); }
    if let Some(table) = &query.table { let expr = Expr::cust(format!("(context ->> 'table') = '{}'", table)); qb = qb.filter(Condition::all().add(expr)); }
    if let Some(operation) = &query.operation { let expr = Expr::cust(format!("(context ->> 'operation') = '{}'", operation)); qb = qb.filter(Condition::all().add(expr)); }

    if let Some(start_date) = &query.start_date {
        if let Ok(start_time) = chrono::DateTime::parse_from_rfc3339(start_date) {
            qb = qb.filter(LogCol::Timestamp.gte(start_time.naive_utc()));
        }
    }
    if let Some(end_date) = &query.end_date {
        if let Ok(end_time) = chrono::DateTime::parse_from_rfc3339(end_date) {
            qb = qb.filter(LogCol::Timestamp.lte(end_time.naive_utc()));
        }
    }

    qb = qb.order_by(LogCol::Timestamp, Order::Desc);
    let paginator = qb.paginate(&**db, limit as u64);
    let total = paginator.num_items().await.map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;
    let logs = paginator.fetch_page((page - 1) as u64).await.map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;

    let items: Vec<AuditLogItem> = logs.into_iter().map(|log| {
        let ctx = log.context.unwrap_or_default();
        let user = ctx.get("user_id").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let ip = ctx.get("ip").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let table = ctx.get("table").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let operation = ctx.get("operation").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let trace_id = ctx.get("trace_id").and_then(|v| v.as_str()).map(|s| s.to_string());
        AuditLogItem {
            id: log.id,
            user,
            timestamp: log.timestamp.to_string(),
            ip,
            trace_id,
            table,
            operation,
        }
    }).collect();

    let response = AuditLogListResponse {
        data: items,
        pagination: Pagination { page, limit, total: total as u32 },
        timestamp: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
        trace_id: generate_snowflake_id(),
    };

    Ok(HttpResponse::Ok().json(response))
}

pub async fn get_audit_log_detail(
    path: web::Path<String>,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    let id = path.into_inner();
    let log = Logs::find_by_id(&id).one(&**db).await.map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;
    let log = match log { Some(l) => l, None => return Err(ApiError::NotFound("审计日志不存在".to_string())) };
    if log.log_source != crate::shared::enums::LogSource::Audit {
        return Err(ApiError::BadRequest("非审计日志".to_string()));
    }
    let ctx = log.context.unwrap_or_default();
    let user = ctx.get("user_id").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let ip = ctx.get("ip").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let table = ctx.get("table").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let operation = ctx.get("operation").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let trace_id = ctx.get("trace_id").and_then(|v| v.as_str()).map(|s| s.to_string());
    let before = ctx.get("before").cloned();
    let after = ctx.get("after").cloned();
    let diff = ctx.get("diff").and_then(|v| v.as_array().cloned()).unwrap_or_default();

    let diff_entries: Vec<ChangeEntry> = diff.into_iter().filter_map(|entry| {
        let path = entry.get("path")?.as_str()?.to_string();
        let t = entry.get("type")?.as_str()?.to_string();
        let before = entry.get("before").cloned();
        let after = entry.get("after").cloned();
        Some(ChangeEntry { path, r#type: t, before, after })
    }).collect();

    let detail = AuditLogDetail {
        id: log.id,
        user,
        timestamp: log.timestamp.to_string(),
        ip,
        trace_id,
        table,
        operation,
        before,
        after,
        diff: diff_entries,
    };

    Ok(HttpResponse::Ok().json(detail))
}

use crate::entities::logs::{ActiveModel as LogActiveModel};
use sea_orm::{ActiveModelTrait, Set};
use chrono::Utc;

pub async fn record_audit_log(
    db: &DatabaseConnection,
    table: &str,
    operation: &str,
    user_id: &str,
    ip: &str,
    trace_id: Option<&str>,
    before: Option<serde_json::Value>,
    after: Option<serde_json::Value>,
) -> Result<(), sea_orm::DbErr> {
    let id = crate::shared::snowflake::generate_snowflake_id();
    let mut context = serde_json::json!({
        "table": table,
        "operation": operation,
        "user_id": user_id,
        "ip": ip,
        "trace_id": trace_id.unwrap_or(""),
    });

    // Compute diff
    let diff = match (&before, &after) {
        (Some(b), Some(a)) => crate::audit::diff::diff_values(b, a),
        _ => Vec::new(),
    };
    let diff_json = serde_json::Value::Array(diff.into_iter().map(|c| serde_json::json!({
        "path": c.path,
        "type": c.r#type,
        "before": c.before,
        "after": c.after,
    })).collect());

    if let Some(b) = before.as_ref() { context["before"] = b.clone(); }
    if let Some(a) = after.as_ref() { context["after"] = a.clone(); }
    context["diff"] = diff_json;

    let active = LogActiveModel {
        id: Set(id.clone()),
        application_id: Set(Some(user_id.to_string())), // 复用字段保存操作者ID
        instance_id: Set(None),
        log_level: Set(crate::shared::enums::LogLevel::Info),
        message: Set(format!("AUDIT {} {}", table, operation)),
        context: Set(Some(context)),
        log_source: Set(crate::shared::enums::LogSource::Audit),
        log_type: Set(crate::shared::enums::LogType::Operation),
        timestamp: Set(Utc::now().into()),
        created_at: Set(Utc::now().into()),
    };

    active.insert(db).await.map(|_| ())
}