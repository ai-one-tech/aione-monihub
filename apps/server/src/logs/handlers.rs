use crate::entities::logs::{Column, Entity as Logs};
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use actix_web::{web, HttpResponse};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, PaginatorTrait, Order};
use crate::logs::models::{LogListQuery, LogListResponse as ModelLogListResponse, LogResponse as ModelLogResponse, Pagination as ModelPagination};

pub async fn get_logs(
    query: web::Query<LogListQuery>,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    // 获取分页参数
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(10).max(1).min(100);
    let _offset = (page - 1) * limit;

    let paginator = Logs::find()
        .filter(Column::LogLevel.eq("INFO")) // 示例过滤条件
        .paginate(&**db, limit as u64);

    let total = paginator.num_items().await.map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;
    let logs = paginator.fetch_page((page - 1) as u64).await.map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;

    // 计算偏移量
    let _offset = (page - 1) * limit;

    // 转换为响应格式
    let log_responses: Vec<ModelLogResponse> = logs
        .into_iter()
        .map(|log| ModelLogResponse {
            id: log.id,
            log_level: log.log_level,
            user_id: log.application_id.unwrap_or_default(),
            action: log.message,
            ip_address: String::new(), // 字段在实体中不存在
            user_agent: String::new(), // 字段在实体中不存在
            timestamp: log.timestamp.to_string(),
            created_at: log.created_at.to_string(),
            updated_at: log.created_at.to_string(), // 使用created_at因为没有updated_at字段
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
        query_builder = query_builder.filter(Column::LogLevel.eq(log_level));
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

    // 获取所有匹配的日志数据
    let logs = query_builder
        .order_by(Column::Timestamp, Order::Desc)
        .all(db.get_ref())
        .await
        .map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;

    // 转换为CSV格式
    let mut csv_data = String::new();
    csv_data.push_str("ID,LogLevel,UserID,Action,IPAddress,UserAgent,Timestamp,CreatedAt,UpdatedAt\n");

    for log in logs {
        // 转义CSV中的特殊字符
        let action_escaped = log.message.replace("\"", "\"\"");
        let ip_address_escaped = Some(String::new()); // 字段在实体中不存在
        let user_agent_escaped = Some(String::new()); // 字段在实体中不存在

        csv_data.push_str(&format!(
            "{},\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\"\n",
            log.id,
            log.log_level,
            log.application_id.unwrap_or_default(),
            action_escaped,
            ip_address_escaped.unwrap_or_default(),
            user_agent_escaped.unwrap_or_default(),
            log.timestamp.to_rfc3339(),
            log.created_at.to_rfc3339(),
            log.created_at.to_rfc3339() // 使用created_at因为没有updated_at字段
        ));
    }

    // 设置响应头，指示这是一个CSV文件下载
    let response = HttpResponse::Ok()
        .content_type("text/csv")
        .insert_header(("Content-Disposition", "attachment; filename=\"logs_export.csv\""))
        .body(csv_data);

    Ok(response)
}