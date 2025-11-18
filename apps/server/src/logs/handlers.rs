use crate::entities::logs::{Column, Entity as Logs};
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use actix_web::{web, HttpResponse};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, PaginatorTrait, Order};
use sea_orm::sea_query::Expr;
use sea_orm::Condition;
use crate::logs::models::{LogListQuery, LogListResponse as ModelLogListResponse, LogResponse as ModelLogResponse, Pagination as ModelPagination};

pub async fn get_logs(
    query: web::Query<LogListQuery>,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    // 获取分页参数
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(10).max(1).min(100);
    let _offset = (page - 1) * limit;

    // 构建查询
    let mut query_builder = Logs::find();

    // 日志级别
    if let Some(log_level) = &query.log_level {
        query_builder = query_builder.filter(Column::LogLevel.eq(log_level.clone()));
    }

    // 用户ID（对应 application_id）
    if let Some(user_id) = &query.user_id {
        query_builder = query_builder.filter(Column::ApplicationId.eq(user_id));
    }

    // 关键字（匹配 message）
    if let Some(keyword) = &query.keyword {
        let like_pattern = format!("%{}%", keyword);
        query_builder = query_builder.filter(Column::Message.like(like_pattern));
    }

    // 方法过滤（基于 context JSON）
    if let Some(method) = &query.method {
        let allowed = ["GET", "POST", "PUT", "DELETE", "PATCH"];
        if allowed.contains(&method.as_str()) {
            let expr = Expr::cust(format!("(context ->> 'method') = '{}'", method));
            query_builder = query_builder.filter(Condition::all().add(expr));
        }
    }

    // 状态码过滤（基于 context JSON）
    if let Some(status) = query.status {
        let expr = Expr::cust(format!("((context ->> 'status')::int) = {}", status));
        query_builder = query_builder.filter(Condition::all().add(expr));
    }

    // URL过滤：优先使用 context.path，其次使用 message LIKE
    if let Some(url) = &query.url {
        // JSON 路径匹配（支持 Postgres 等）
        let escaped = url.replace("%", "\\%").replace("_", "\\_");
        let expr = Expr::cust(format!("(context ->> 'path') ILIKE '%{}%'", escaped));
        query_builder = query_builder.filter(Condition::all().add(expr));
        // 兜底：message LIKE，确保非 JSON 数据库也生效
        let like_pattern = format!("%{}%", url);
        query_builder = query_builder.filter(Column::Message.like(like_pattern));
    }

    // 时间范围（timestamp）
    if let Some(start_date) = &query.start_date {
        if let Ok(start_time) = chrono::DateTime::parse_from_rfc3339(start_date) {
            query_builder = query_builder.filter(Column::Timestamp.gte(start_time.naive_utc()));
        }
    }

    // 来源过滤（log_source）
    if let Some(source) = &query.source {
        query_builder = query_builder.filter(Column::LogSource.eq(source.clone()));
    }
    // 类型过滤（log_type）
    if let Some(log_type) = &query.log_type {
        query_builder = query_builder.filter(Column::LogType.eq(log_type.clone()));
    }
    // 应用/实例过滤
    if let Some(instance_id) = &query.instance_id {
        query_builder = query_builder.filter(Column::InstanceId.eq(instance_id.clone()));
    }
    if let Some(end_date) = &query.end_date {
        if let Ok(end_time) = chrono::DateTime::parse_from_rfc3339(end_date) {
            query_builder = query_builder.filter(Column::Timestamp.lte(end_time.naive_utc()));
        }
    }

    // 排序与分页
    query_builder = query_builder.order_by(Column::Timestamp, Order::Desc);
    let paginator = query_builder.paginate(&**db, limit as u64);

    let total = paginator.num_items().await.map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;
    let logs = paginator.fetch_page((page - 1) as u64).await.map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;

    // 计算偏移量（分页）
    let _offset = (page - 1) * limit;

    // 转换为响应格式
    let log_responses: Vec<ModelLogResponse> = logs
        .into_iter()
        .map(|log| ModelLogResponse {
            id: log.id,
            log_level: log.log_level,
            application_id: log.application_id.unwrap_or_default(),
            instance_id: log.instance_id.unwrap_or_default(),
            message: log.message,
            log_type: log.log_type,
            ip_address: log
                .context
                .as_ref()
                .and_then(|ctx| ctx.get("ip"))
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            user_agent: log
                .context
                .as_ref()
                .and_then(|ctx| ctx.get("user_agent"))
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            log_source: log.log_source.clone(),
            timestamp: log.timestamp.to_string(),
            created_at: log.created_at.to_string(),
            updated_at: log.created_at.to_string(), // 使用created_at因为没有updated_at字段
            context: log.context.clone(), // 使用created_at因为没有updated_at字段
            method: log.context.as_ref().and_then(|ctx| ctx.get("method")).and_then(|v| v.as_str()).map(|s| s.to_string()),
            path: log.context.as_ref().and_then(|ctx| ctx.get("path")).and_then(|v| v.as_str()).map(|s| s.to_string()),
            status: log.context.as_ref().and_then(|ctx| ctx.get("status")).and_then(|v| v.as_i64()).map(|n| n as i32),
            request_headers: log.context.as_ref().and_then(|ctx| ctx.get("request_headers")).cloned(),
            request_body: log.context.as_ref().and_then(|ctx| ctx.get("request_body")).cloned(),
            response_body: log.context.as_ref().and_then(|ctx| ctx.get("response_body")).cloned(),
            duration_ms: log.context.as_ref().and_then(|ctx| ctx.get("duration_ms")).and_then(|v| v.as_i64()),
            trace_id: log.context.as_ref().and_then(|ctx| ctx.get("trace_id")).and_then(|v| v.as_str()).map(|s| s.to_string()),
        })
        .collect();

    let response = ModelLogListResponse {
        data: log_responses,
        pagination: ModelPagination {
            page,
            limit,
            total: total as u32,
        },
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: generate_snowflake_id(),
    };

    Ok(HttpResponse::Ok().json(response))
}

pub async fn export_logs(
    query: web::Query<LogListQuery>,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    // 构建查询
    let mut query_builder = Logs::find();

    // 添加日志级别过滤
    if let Some(log_level) = &query.log_level {
        query_builder = query_builder.filter(Column::LogLevel.eq(log_level.clone()));
    }

    // 添加用户ID过滤
    if let Some(user_id) = &query.user_id {
        query_builder = query_builder.filter(Column::ApplicationId.eq(user_id));
    }

    // 添加时间范围过滤
    if let Some(start_date) = &query.start_date {
        if let Ok(start_time) = chrono::DateTime::parse_from_rfc3339(start_date) {
            query_builder = query_builder.filter(Column::Timestamp.gte(start_time.naive_utc()));
        }
    }

    if let Some(end_date) = &query.end_date {
        if let Ok(end_time) = chrono::DateTime::parse_from_rfc3339(end_date) {
            query_builder = query_builder.filter(Column::Timestamp.lte(end_time.naive_utc()));
        }
    }

    // 关键字过滤（message LIKE %keyword%）
    if let Some(keyword) = &query.keyword {
        let like_pattern = format!("%{}%", keyword);
        query_builder = query_builder.filter(Column::Message.like(like_pattern));
    }

    // 方法过滤（基于 context JSON）
    if let Some(method) = &query.method {
        let allowed = ["GET", "POST", "PUT", "DELETE", "PATCH"];
        if allowed.contains(&method.as_str()) {
            let expr = Expr::cust(format!("(context ->> 'method') = '{}'", method));
            query_builder = query_builder.filter(Condition::all().add(expr));
        }
    }

    // 状态码过滤（基于 context JSON）
    if let Some(status) = query.status {
        let expr = Expr::cust(format!("((context ->> 'status')::int) = {}", status));
        query_builder = query_builder.filter(Condition::all().add(expr));
    }

    // URL过滤（基于 context JSON，模糊）
    if let Some(url) = &query.url {
        let escaped = url.replace("%", "\\%").replace("_", "\\_");
        let expr = Expr::cust(format!("(context ->> 'path') ILIKE '%{}%'", escaped));
        query_builder = query_builder.filter(Condition::all().add(expr));
    }
    // 类型过滤（log_type）
    if let Some(log_type) = &query.log_type {
        query_builder = query_builder.filter(Column::LogType.eq(log_type.clone()));
    }

    // 获取所有匹配的日志数据
    let logs = query_builder
        .order_by(Column::Timestamp, Order::Desc)
        .all(db.get_ref())
        .await
        .map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;

    // 转换为CSV格式（添加UTF-8 BOM以避免Excel中文乱码）
    let mut csv_data = String::new();
    csv_data.push_str("\u{FEFF}");
    csv_data.push_str("ID,LogLevel,UserID,Action,IPAddress,UserAgent,Timestamp,CreatedAt,UpdatedAt\n");

    for log in logs {
        // 转义CSV中的特殊字符
        let action_escaped = log.message.replace("\"", "\"\"");
        let ip_address_escaped = Some(String::new()); // 字段在实体中不存在
        let user_agent_escaped = Some(String::new()); // 字段在实体中不存在

        csv_data.push_str(&format!(
            "{},\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\"\n",
            log.id,
            log.log_level.to_string(),
            log.application_id.unwrap_or_default(),
            action_escaped,
            ip_address_escaped.unwrap_or_default(),
            user_agent_escaped.unwrap_or_default(),
            log.timestamp.to_rfc3339(),
            log.created_at.to_rfc3339(),
            log.created_at.to_rfc3339() // 使用created_at因为没有updated_at字段
        ));
    }

    // 设置响应头，指示这是一个CSV文件下载，并声明编码为UTF-8
    let response = HttpResponse::Ok()
        .content_type("text/csv; charset=utf-8")
        .insert_header(("Content-Disposition", "attachment; filename=\"logs_export.csv\""))
        .body(csv_data);

    Ok(response)
}
