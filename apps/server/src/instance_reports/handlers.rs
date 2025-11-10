use crate::instance_reports::models::{
    InstanceRecordListQuery, InstanceRecordListResponse, InstanceRecordResponse,
    InstanceReportRequest, InstanceReportResponse, Pagination,
};
use crate::shared::error::ApiError;
use crate::shared::generate_snowflake_id;
use crate::entities::{instance_records, instances, applications};
use crate::shared::enums::{Status, OnlineStatus, NetworkType};
use actix_web::{web, HttpResponse, Result};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait,
    QueryFilter, QueryOrder, QuerySelect, Set,
};
use rust_decimal::Decimal;
use std::str::FromStr;

/// POST /api/open/instances/report
/// 实例信息上报接口（开放接口，无需认证）
pub async fn report_instance_info(
    db: web::Data<DatabaseConnection>,
    request: web::Json<InstanceReportRequest>,
) -> Result<HttpResponse, ApiError> {
    // 1. 验证 application_code 不能为空
    if request.application_code.trim().is_empty() {
        return Err(ApiError::BadRequest("application_code cannot be empty".to_string()));
    }

    // 2. 通过 application_code 查询 application_id，如果不存在则报错
    let application = applications::Entity::find()
        .filter(applications::Column::Code.eq(&request.application_code))
        .filter(applications::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;
    
    let application_id = match application {
        Some(app) => app.id,
        None => {
            return Err(ApiError::NotFound(
                format!("Application with code '{}' not found", request.application_code)
            ));
        }
    };

    // 5. 验证实例是否存在，如果不存在则自动创建
    let instance = instances::Entity::find()
        .filter(instances::Column::Id.eq(&request.instance_id))
        .filter(instances::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let instance = if instance.is_none() {
        // 自动创建新实例
        
        let new_instance = instances::ActiveModel {
            id: Set(request.instance_id.clone()),
            hostname: Set(request.system_info.hostname.clone().unwrap_or_default()),
            ip_address: Set(request.network_info.ip_address.clone().unwrap_or_default()),
            status: Set(Status::Active),
            online_status: Set(OnlineStatus::Online),
            environment: Set(request.environment.clone()),
            application_id: Set(application_id.clone()),
            mac_address: Set(request.network_info.mac_address.clone()),
            public_ip: Set(request.network_info.public_ip.clone()),
            port: Set(request.network_info.port),
            program_path: Set(request.program_path.clone()),
            profiles: Set(request.profiles.clone()),
            os_type: Set(Some(request.system_info.os_type.clone())),
            os_version: Set(request.system_info.os_version.clone()),
            first_report_at: Set(None),
            last_report_at: Set(None),
            report_count: Set(None),
            custom_fields: Set(request.custom_fields.clone()),
            agent_type: Set(Some(request.agent_type.clone())),
            agent_version: Set(request.agent_version.clone()),
            cpu_usage_percent: Set(None),
            memory_usage_percent: Set(None),
            disk_usage_percent: Set(None),
            process_uptime_seconds: Set(None),
            network_type: Set(request.network_info.network_type.clone()),
            offline_at: Set(None),
            created_by: Set("system-auto".to_string()),
            updated_by: Set("system-auto".to_string()),
            deleted_at: Set(None),
            revision: Set(0),
            created_at: Set(Utc::now().into()),
            updated_at: Set(Utc::now().into()),
        };
        new_instance.insert(&**db).await?
    } else {
        // 增加对实例状态的判断，如果是禁用，则不允许更新（避免移动，使用引用比较）
        if instance
            .as_ref()
            .map(|i| i.status.clone())
            != Some(Status::Active)
        {
            return Err(ApiError::BadRequest("Instance is disabled".to_string()));
        }
        instance.unwrap()
    };

    // 5. 解析上报时间
    let report_timestamp = chrono::DateTime::parse_from_rfc3339(&request.report_timestamp)
        .map_err(|_| ApiError::BadRequest("Invalid report_timestamp format, expected ISO 8601".to_string()))?
        .with_timezone(&Utc);

    // 6. 生成记录ID
    let record_id = generate_snowflake_id();

    // 7. 插入上报记录
    let cpu_usage_decimal = Decimal::from_str(&request.hardware_info.cpu_usage_percent.to_string())
        .map_err(|_| ApiError::BadRequest("Invalid cpu_usage_percent".to_string()))?;
    let memory_usage_decimal = Decimal::from_str(&request.hardware_info.memory_usage_percent.to_string())
        .map_err(|_| ApiError::BadRequest("Invalid memory_usage_percent".to_string()))?;
    let disk_usage_decimal = Decimal::from_str(&request.hardware_info.disk_usage_percent.to_string())
        .map_err(|_| ApiError::BadRequest("Invalid disk_usage_percent".to_string()))?;

    let record = instance_records::ActiveModel {
        id: Set(record_id.clone()),
        instance_id: Set(request.instance_id.clone()),
        agent_type: Set(request.agent_type.clone()),
        agent_version: Set(request.agent_version.clone()),
        os_type: Set(Some(request.system_info.os_type.clone())),
        os_version: Set(request.system_info.os_version.clone()),
        hostname: Set(request.system_info.hostname.clone()),
        ip_address: Set(request.network_info.ip_address.clone()),
        public_ip: Set(request.network_info.public_ip.clone()),
        mac_address: Set(request.network_info.mac_address.clone()),
        network_type: Set(request.network_info.network_type.clone()),
        cpu_model: Set(request.hardware_info.cpu_model.clone()),
        cpu_cores: Set(request.hardware_info.cpu_cores),
        cpu_usage_percent: Set(Some(cpu_usage_decimal)),
        memory_total_mb: Set(Some(request.hardware_info.memory_total_mb)),
        memory_used_mb: Set(Some(request.hardware_info.memory_used_mb)),
        memory_usage_percent: Set(Some(memory_usage_decimal)),
        disk_total_gb: Set(Some(request.hardware_info.disk_total_gb)),
        disk_used_gb: Set(Some(request.hardware_info.disk_used_gb)),
        disk_usage_percent: Set(Some(disk_usage_decimal)),
        process_id: Set(request.runtime_info.process_id),
        process_uptime_seconds: Set(Some(request.runtime_info.process_uptime_seconds)),
        thread_count: Set(request.runtime_info.thread_count),
        custom_metrics: Set(request.custom_metrics.clone()),
        report_timestamp: Set(report_timestamp.into()),
        received_at: Set(Utc::now().into()),
        created_at: Set(Utc::now().into()),
    };

    // ... existing code ...
    record.insert(&**db).await?;

    // 8. 更新实例表的最新状态
    // 在转换前先获取 report_count 和 first_report_at 的值
    let current_report_count = instance.report_count;
    let first_report_at_is_none = instance.first_report_at.is_none();
    
    let mut instance_update: instances::ActiveModel = instance.into();
    instance_update.agent_type = Set(Some(request.agent_type.clone()));
    instance_update.agent_version = Set(request.agent_version.clone());
    instance_update.cpu_usage_percent = Set(Some(cpu_usage_decimal));
    instance_update.memory_usage_percent = Set(Some(memory_usage_decimal));
    instance_update.disk_usage_percent = Set(Some(disk_usage_decimal));
    instance_update.process_uptime_seconds = Set(Some(request.runtime_info.process_uptime_seconds));
    instance_update.network_type = Set(request.network_info.network_type.clone());
    instance_update.last_report_at = Set(Some(Utc::now().into()));
    // 恢复为 Active 并清空 offline_at
    instance_update.status = Set(Status::Active);
    instance_update.online_status = Set(OnlineStatus::Online);
    instance_update.offline_at = Set(None);
    
    // 更新上报次数
    instance_update.report_count = Set(Some(
        match current_report_count {
            Some(count) => count + 1,
            None => 1,
        }
    ));
    
    // 如果是首次上报，设置 first_report_at
    if first_report_at_is_none {
        instance_update.first_report_at = Set(Some(Utc::now().into()));
    }
    
    instance_update.updated_at = Set(Utc::now().into());
    instance_update.update(&**db).await?;

    // 9. 返回成功响应
    let response = InstanceReportResponse {
        status: "success".to_string(),
        message: "Instance report received successfully".to_string(),
        record_id,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };

    Ok(HttpResponse::Ok().json(response))
}

/// GET /api/instances/{instance_id}/reports
/// 查询实例上报历史记录（需要认证）
pub async fn get_instance_reports(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    query: web::Query<InstanceRecordListQuery>,
) -> Result<HttpResponse, ApiError> {
    let instance_id = path.into_inner();

    // 验证实例是否存在
    let instance = instances::Entity::find()
        .filter(instances::Column::Id.eq(&instance_id))
        .filter(instances::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if instance.is_none() {
        return Err(ApiError::NotFound("Instance not found".to_string()));
    }

    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100); // 最大100条
    let offset = (page - 1) * limit;

    // 构建查询
    let mut select = instance_records::Entity::find()
        .filter(instance_records::Column::InstanceId.eq(&instance_id));

    // 添加时间范围过滤
    if let Some(start_time) = &query.start_time {
        let start_dt = chrono::DateTime::parse_from_rfc3339(start_time)
            .map_err(|_| ApiError::BadRequest("Invalid start_time format".to_string()))?
            .with_timezone(&Utc);
        select = select.filter(instance_records::Column::ReportTimestamp.gte(start_dt));
    }

    if let Some(end_time) = &query.end_time {
        let end_dt = chrono::DateTime::parse_from_rfc3339(end_time)
            .map_err(|_| ApiError::BadRequest("Invalid end_time format".to_string()))?
            .with_timezone(&Utc);
        select = select.filter(instance_records::Column::ReportTimestamp.lte(end_dt));
    }

    // 获取总数
    let total = select.clone().count(&**db).await?;

    // 获取分页数据（按上报时间倒序）
    let records = select
        .order_by_desc(instance_records::Column::ReportTimestamp)
        .offset(offset as u64)
        .limit(limit as u64)
        .all(&**db)
        .await?;

    // 转换为响应格式
    let record_responses: Vec<InstanceRecordResponse> = records
        .into_iter()
        .map(InstanceRecordResponse::from_entity)
        .collect();

    let response = InstanceRecordListResponse {
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
