use crate::auth::middleware::get_user_id_from_request;
use crate::entities::{instance_task_records, instance_tasks, instances};
use crate::instance_tasks::models::*;
use crate::shared::enums::{TaskStatus};
use crate::shared::error::ApiError;
use crate::shared::generate_snowflake_id;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, QuerySelect, Set,
};
use serde_json::json;
use std::time::Duration;
use tokio::time::sleep;

/// POST /api/instances/tasks
/// 创建任务
pub async fn create_task(
    db: web::Data<DatabaseConnection>,
    request: web::Json<TaskCreateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = get_user_id_from_request(&req)?;

    // 验证目标实例是否存在
    for instance_id in &request.target_instances {
        let instance = instances::Entity::find_by_id(instance_id)
            .filter(instances::Column::DeletedAt.is_null())
            .one(&**db)
            .await?;

        if instance.is_none() {
            return Err(ApiError::NotFound(format!(
                "Instance {} not found",
                instance_id
            )));
        }
    }

    // 生成任务ID
    let task_id = generate_snowflake_id();

    // 创建任务
    let task = instance_tasks::ActiveModel {
        id: Set(task_id.clone()),
        task_name: Set(request.task_name.clone()),
        task_type: Set(request.task_type.clone()),
        target_instances: Set(json!(request.target_instances)),
        task_content: Set(request.task_content.clone()),
        priority: Set(request.priority),
        timeout_seconds: Set(request.timeout_seconds),
        retry_count: Set(request.retry_count),
        application_id: Set(request.application_id.clone()),
        created_by: Set(user_id),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
        deleted_at: Set(None),
    };

    let saved_task = task.insert(&**db).await?;

    // 为每个目标实例创建执行记录
    for instance_id in &request.target_instances {
        let record_id = generate_snowflake_id();
        let record = instance_task_records::ActiveModel {
            id: Set(record_id),
            task_id: Set(task_id.clone()),
            instance_id: Set(instance_id.clone()),
            status: Set(TaskStatus::Dispatched),
            dispatch_time: Set(None),
            start_time: Set(None),
            end_time: Set(None),
            duration_ms: Set(None),
            result_code: Set(None),
            result_message: Set(None),
            result_data: Set(None),
            error_message: Set(None),
            retry_attempt: Set(Some(0)),
            created_at: Set(Utc::now().into()),
            updated_at: Set(Utc::now().into()),
        };

        record.insert(&**db).await?;
    }

    let response = TaskResponse::from_entity(saved_task);
    Ok(HttpResponse::Ok().json(response))
}

/// GET /api/instances/tasks
/// 获取任务列表
pub async fn get_tasks(
    db: web::Data<DatabaseConnection>,
    query: web::Query<TaskListQuery>,
) -> Result<HttpResponse, ApiError> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = (page - 1) * limit;

    let mut select =
        instance_tasks::Entity::find().filter(instance_tasks::Column::DeletedAt.is_null());

    // 添加任务类型过滤
    if let Some(task_type) = &query.task_type {
        select = select.filter(instance_tasks::Column::TaskType.eq(task_type));
    }

    // 添加应用ID过滤
    if let Some(application_id) = &query.application_id {
        select = select.filter(instance_tasks::Column::ApplicationId.eq(application_id));
    }

    // 添加时间范围过滤
    if let Some(start_time) = &query.start_time {
        let start_dt = chrono::DateTime::parse_from_rfc3339(start_time)
            .map_err(|_| ApiError::BadRequest("Invalid start_time format".to_string()))?
            .with_timezone(&Utc);
        select = select.filter(instance_tasks::Column::CreatedAt.gte(start_dt));
    }

    if let Some(end_time) = &query.end_time {
        let end_dt = chrono::DateTime::parse_from_rfc3339(end_time)
            .map_err(|_| ApiError::BadRequest("Invalid end_time format".to_string()))?
            .with_timezone(&Utc);
        select = select.filter(instance_tasks::Column::CreatedAt.lte(end_dt));
    }

    let total = select.clone().count(&**db).await?;

    let tasks = select
        .order_by_desc(instance_tasks::Column::CreatedAt)
        .offset(offset as u64)
        .limit(limit as u64)
        .all(&**db)
        .await?;

    let task_responses: Vec<TaskResponse> =
        tasks.into_iter().map(TaskResponse::from_entity).collect();

    let response = TaskListResponse {
        data: task_responses,
        pagination: Pagination {
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

/// GET /api/instances/tasks/{task_id}
/// 获取任务详情
pub async fn get_task(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let task_id = path.into_inner();

    let task = instance_tasks::Entity::find_by_id(&task_id)
        .filter(instance_tasks::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    match task {
        Some(task) => {
            let response = TaskResponse::from_entity(task);
            Ok(HttpResponse::Ok().json(response))
        }
        None => Err(ApiError::NotFound("Task not found".to_string())),
    }
}

/// DELETE /api/instances/tasks/{task_id}
/// 删除任务（软删除）
pub async fn delete_task(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let task_id = path.into_inner();

    let task = instance_tasks::Entity::find_by_id(&task_id)
        .filter(instance_tasks::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    match task {
        Some(task) => {
            let mut active: instance_tasks::ActiveModel = task.into();
            active.deleted_at = Set(Some(Utc::now().into()));
            active.updated_at = Set(Utc::now().into());
            active.update(&**db).await?;

            Ok(HttpResponse::Ok().json(json!({
                "status": "success",
                "message": "Task deleted successfully"
            })))
        }
        None => Err(ApiError::NotFound("Task not found".to_string())),
    }
}

/// POST /api/instances/tasks/{task_id}/cancel
/// 取消任务
pub async fn cancel_task(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let task_id = path.into_inner();

    // 将所有pending和dispatched状态的记录更新为cancelled
    let records = instance_task_records::Entity::find()
        .filter(instance_task_records::Column::TaskId.eq(&task_id))
        .filter(instance_task_records::Column::Status.is_in(vec![TaskStatus::Pending, TaskStatus::Dispatched]))
        .all(&**db)
        .await?;

    for record in records {
        let mut active: instance_task_records::ActiveModel = record.into();
        active.status = Set(TaskStatus::Cancelled);
        active.updated_at = Set(Utc::now().into());
        active.update(&**db).await?;
    }

    Ok(HttpResponse::Ok().json(json!({
        "status": "success",
        "message": "Task cancelled successfully"
    })))
}

/// GET /api/instances/tasks/{task_id}/records
/// 获取任务执行记录
pub async fn get_task_records(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    query: web::Query<TaskRecordListQuery>,
) -> Result<HttpResponse, ApiError> {
    let task_id = path.into_inner();

    // 验证任务是否存在
    let task = instance_tasks::Entity::find_by_id(&task_id)
        .filter(instance_tasks::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if task.is_none() {
        return Err(ApiError::NotFound("Task not found".to_string()));
    }

    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = (page - 1) * limit;

    let mut select = instance_task_records::Entity::find()
        .filter(instance_task_records::Column::TaskId.eq(&task_id));

    // 添加状态过滤
    if let Some(status) = &query.status {
        select = select.filter(instance_task_records::Column::Status.eq(status));
    }

    let total = select.clone().count(&**db).await?;

    let records = select
        .order_by_desc(instance_task_records::Column::CreatedAt)
        .offset(offset as u64)
        .limit(limit as u64)
        .all(&**db)
        .await?;

    let record_responses: Vec<TaskRecordResponse> = records
        .into_iter()
        .map(TaskRecordResponse::from_entity)
        .collect();

    let response = TaskRecordListResponse {
        data: record_responses,
        pagination: Pagination {
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

/// POST /api/instances/task-records/{record_id}/retry
/// 重试任务执行
pub async fn retry_task_record(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let record_id = path.into_inner();

    let record = instance_task_records::Entity::find_by_id(&record_id)
        .one(&**db)
        .await?;

    match record {
        Some(record) => {
            if record.status != TaskStatus::Failed && record.status != TaskStatus::Timeout {
                return Err(ApiError::BadRequest(
                    "Only failed or timeout tasks can be retried".to_string(),
                ));
            }

            let mut active: instance_task_records::ActiveModel = record.into();
            active.status = Set(TaskStatus::Dispatched);
            active.retry_attempt = Set(Some(active.retry_attempt.unwrap().unwrap_or(0) + 1));
            active.updated_at = Set(Utc::now().into());
            active.update(&**db).await?;

            Ok(HttpResponse::Ok().json(json!({
                "status": "success",
                "message": "Task retry initiated"
            })))
        }
        None => Err(ApiError::NotFound("Task record not found".to_string())),
    }
}

/// GET /api/open/instances/tasks
/// Agent拉取待执行任务（支持长轮询）
#[utoipa::path(
    get,
    path = "/api/open/instances/tasks",
    params(
        ("instance_id" = String, Query, description = "实例ID"),
        ("wait" = Option<bool>, Query, description = "是否启用长轮询"),
        ("timeout" = Option<u64>, Query, description = "超时时间(秒)")
    ),
    responses(
        (status = 200, description = "成功返回任务列表", body = TaskDispatchResponse),
        (status = 400, description = "缺少instance_id参数"),
        (status = 404, description = "实例不存在"),
        (status = 500, description = "服务器错误")
    ),
    tag = "Instance Tasks"
)]
pub async fn get_instance_tasks(
    db: web::Data<DatabaseConnection>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, ApiError> {
    // 从查询参数中获取instance_id
    let agent_instance_id = query
        .get("agent_instance_id")
        .ok_or_else(|| ApiError::BadRequest("Missing required parameter: instance_id".to_string()))?
        .clone();
    log::info!(
        "[get_instance_tasks] Received request for instance: {}",
        agent_instance_id
    );

    // 验证实例是否存在
    let instance = instances::Entity::find()
        .filter(instances::Column::AgentInstanceId.eq(&agent_instance_id))
        .filter(instances::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if instance.is_none() {
        log::warn!("[get_instance_tasks] Instance not found: {}", agent_instance_id);
        return Err(ApiError::NotFound(format!(
            "Instance {} not found",
            agent_instance_id
        )));
    }
    log::debug!("[get_instance_tasks] Instance found: {}", agent_instance_id);

    // 检查是否启用长轮询
    let wait = query
        .get("wait")
        .and_then(|v| v.parse::<bool>().ok())
        .unwrap_or(false);
    let timeout_secs = query
        .get("timeout")
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(30)
        .min(60);

    let start_time = std::time::Instant::now();
    let max_duration = Duration::from_secs(timeout_secs);

    loop {
        // 查询pending状态的任务
        let records = instance_task_records::Entity::find()
            .filter(instance_task_records::Column::InstanceId.eq(&agent_instance_id))
            .filter(instance_task_records::Column::Status.eq(TaskStatus::Dispatched))
            .order_by_asc(instance_task_records::Column::CreatedAt)
            .all(&**db)
            .await?;

        if !records.is_empty() {
            // 有待执行任务，构造响应
            let mut tasks = Vec::new();

            for record in records {
                // 查询任务详情
                let task = instance_tasks::Entity::find_by_id(&record.task_id)
                    .filter(instance_tasks::Column::DeletedAt.is_null())
                    .one(&**db)
                    .await?;

                if let Some(task) = task {
                    tasks.push(TaskDispatchItem {
                        task_id: task.id.clone(),
                        record_id: record.id.clone(),
                        task_type: task.task_type,
                        task_content: task.task_content,
                        timeout_seconds: task.timeout_seconds.unwrap_or(300),
                        priority: task.priority.unwrap_or(5),
                    });

                    // 更新记录状态为dispatched
                    let mut active: instance_task_records::ActiveModel = record.into();
                    active.status = Set(TaskStatus::Dispatched);
                    active.dispatch_time = Set(Some(Utc::now().into()));
                    active.updated_at = Set(Utc::now().into());
                    active.update(&**db).await?;
                }
            }

            // 按优先级降序排序
            tasks.sort_by(|a, b| b.priority.cmp(&a.priority));

            let response = TaskDispatchResponse {
                tasks,
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            };

            return Ok(HttpResponse::Ok().json(response));
        }

        // 如果不启用长轮询或已超时，返回空列表
        if !wait || start_time.elapsed() >= max_duration {
            let response = TaskDispatchResponse {
                tasks: vec![],
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            };
            return Ok(HttpResponse::Ok().json(response));
        }

        // 等待2秒后重试
        sleep(Duration::from_secs(2)).await;
    }
}

/// POST /api/open/instances/tasks/result
/// Agent回传任务执行结果
#[utoipa::path(
    post,
    path = "/api/open/instances/tasks/result",
    request_body = TaskResultSubmitRequest,
    responses(
        (status = 200, description = "任务结果接收成功", body = TaskResultSubmitResponse),
        (status = 400, description = "请求参数错误"),
        (status = 404, description = "任务记录不存在"),
        (status = 500, description = "服务器错误")
    ),
    tag = "Instance Tasks"
)]
pub async fn submit_task_result(
    db: web::Data<DatabaseConnection>,
    request: web::Json<TaskResultSubmitRequest>,
) -> Result<HttpResponse, ApiError> {
    // 验证记录是否存在
    let record = instance_task_records::Entity::find_by_id(&request.record_id)
        .one(&**db)
        .await?;

    let record = match record {
        Some(r) => r,
        None => {
            return Err(ApiError::NotFound("Task record not found".to_string()));
        }
    };

    // 验证instance_id是否匹配
    if record.instance_id != request.instance_id {
        return Err(ApiError::BadRequest("Instance ID mismatch".to_string()));
    }

    // 解析时间
    let start_time = chrono::DateTime::parse_from_rfc3339(&request.start_time)
        .map_err(|_| ApiError::BadRequest("Invalid start_time format".to_string()))?
        .with_timezone(&Utc);

    let end_time = chrono::DateTime::parse_from_rfc3339(&request.end_time)
        .map_err(|_| ApiError::BadRequest("Invalid end_time format".to_string()))?
        .with_timezone(&Utc);

    // 更新记录
    let mut active: instance_task_records::ActiveModel = record.into();
    active.status = Set(request.status.clone());
    active.start_time = Set(Some(start_time.into()));
    active.end_time = Set(Some(end_time.into()));
    active.duration_ms = Set(Some(request.duration_ms));
    active.result_code = Set(Some(request.result_code));
    active.result_message = Set(request.result_message.clone());
    active.result_data = Set(request.result_data.clone());
    active.error_message = Set(request.error_message.clone());
    active.updated_at = Set(Utc::now().into());
    active.update(&**db).await?;

    let response = TaskResultSubmitResponse {
        status: "success".to_string(),
        message: "Task result received successfully".to_string(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };

    Ok(HttpResponse::Ok().json(response))
}
/// GET /api/instances/tasks/{task_id}/instances-with-results
/// 获取任务关联的实例及执行结果
#[utoipa::path(
    get,
    path = "/api/instances/tasks/{task_id}/instances-with-results",
    params(
        ("task_id" = String, Path, description = "任务ID"),
        TaskRecordListQuery
    ),
    responses(
        (status = 200, description = "获取任务关联的实例及执行结果成功", body = TaskInstanceWithResultResponse),
        (status = 404, description = "任务不存在"),
        (status = 500, description = "服务器内部错误")
    ),
    tag = "Instance Tasks"
)]
pub async fn get_task_instances_with_results(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    query: web::Query<TaskRecordListQuery>,
) -> Result<HttpResponse, ApiError> {
    let task_id = path.into_inner();

    // 验证任务是否存在
    let task = instance_tasks::Entity::find_by_id(&task_id)
        .filter(instance_tasks::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if task.is_none() {
        return Err(ApiError::NotFound("Task not found".to_string()));
    }

    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = (page - 1) * limit;

    // 查询任务执行记录，关联实例信息
    let mut records_query = instance_task_records::Entity::find()
        .filter(instance_task_records::Column::TaskId.eq(&task_id))
        .order_by_desc(instance_task_records::Column::CreatedAt);

    // 添加状态过滤
    if let Some(status) = &query.status {
        records_query = records_query.filter(instance_task_records::Column::Status.eq(status));
    }

    let _total = records_query.clone().count(&**db).await?;

    let records = records_query
        .offset(offset as u64)
        .limit(limit as u64)
        .all(&**db)
        .await?;

    let mut task_instances_with_results = Vec::new();

    for record in records {
        // 查询实例信息
        let instance = instances::Entity::find_by_id(&record.instance_id)
            .filter(instances::Column::DeletedAt.is_null())
            .one(&**db)
            .await?;

        if let Some(instance) = instance {
            let instance_info = crate::instance_tasks::models::InstanceInfo {
                id: instance.id,
                agent_instance_id: instance.agent_instance_id.unwrap_or_default(),
                hostname: Some(instance.hostname),
                ip_address: Some(instance.ip_address),
                public_ip: instance.public_ip,
                os_type: instance.os_type.unwrap_or(crate::shared::enums::OsType::Unknown),
                os_version: instance.os_version,
                online_status: instance.online_status,
                last_heartbeat: instance.last_report_at.map(|t| t.to_rfc3339()),
                created_at: instance.created_at.to_rfc3339(),
                updated_at: instance.updated_at.to_rfc3339(),
            };

            let record_response = crate::instance_tasks::models::TaskRecordResponse::from_entity(record);

            let task_instance_with_result = crate::instance_tasks::models::TaskInstanceWithResult {
                instance: instance_info,
                execution_record: record_response,
            };

            task_instances_with_results.push(task_instance_with_result);
        }
    }

    let response = crate::instance_tasks::models::TaskInstanceWithResultResponse {
        task_id,
        data: task_instances_with_results,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: crate::shared::generate_snowflake_id(),
    };

    Ok(HttpResponse::Ok().json(response))
}
