/// GET /api/instances/tasks/{task_id}/instances-with-results
/// 获取任务关联的实例及执行结果
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

    let total = records_query.clone().count(&**db).await?;

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
