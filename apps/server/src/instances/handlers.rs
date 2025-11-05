use crate::instances::models::{
    InstanceCreateRequest, InstanceListQuery, InstanceListResponse, InstanceMonitoringDataResponse,
    InstanceResponse, Pagination,
};
use crate::shared::error::ApiError;
use crate::shared::status::is_valid_status;
use crate::shared::generate_snowflake_id;
use crate::entities::instances::{Entity as Instances, ActiveModel};
use actix_web::{web, HttpResponse, Result, HttpRequest};
use crate::auth::middleware::get_user_id_from_request;
use crate::permissions::handlers::{get_user_permission_by_name};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, 
    PaginatorTrait, QueryFilter, QueryOrder, QuerySelect, Set
};

pub async fn get_instances(
    db: web::Data<DatabaseConnection>,
    query: web::Query<InstanceListQuery>
) -> Result<HttpResponse, ApiError> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(10);
    let offset = (page - 1) * limit;

    // 构建查询条件
    let mut select = Instances::find()
        .filter(crate::entities::instances::Column::DeletedAt.is_null());

    // 添加搜索过滤器
    if let Some(search) = &query.search {
        select = select.filter(
            crate::entities::instances::Column::Hostname.contains(search)
                .or(crate::entities::instances::Column::IpAddress.contains(search))
                .or(crate::entities::instances::Column::PublicIp.contains(search))
                .or(crate::entities::instances::Column::ApplicationId.contains(search))
        );
    }

    // 添加状态过滤器
    if let Some(status) = &query.status {
        select = select.filter(crate::entities::instances::Column::Status.eq(status));
    }

    // 添加应用ID过滤器
    if let Some(application_id) = &query.application_id {
        select = select.filter(crate::entities::instances::Column::ApplicationId.eq(application_id));
    }

    // 添加内网IP过滤器
    if let Some(ip_address) = &query.ip_address {
        select = select.filter(crate::entities::instances::Column::IpAddress.contains(ip_address));
    }

    // 添加公网IP过滤器
    if let Some(public_ip) = &query.public_ip {
        select = select.filter(crate::entities::instances::Column::PublicIp.contains(public_ip));
    }

    // 添加计算机名过滤器
    if let Some(hostname) = &query.hostname {
        select = select.filter(crate::entities::instances::Column::Hostname.contains(hostname));
    }

    // 获取总数
    let total = select.clone().count(&**db).await?;

    // 获取分页数据
    let instances = select
        .order_by_desc(crate::entities::instances::Column::CreatedAt)
        .offset(offset as u64)
        .limit(limit as u64)
        .all(&**db)
        .await?;

    // 转换为响应格式
    let instance_responses: Vec<InstanceResponse> = instances
        .into_iter()
        .map(InstanceResponse::from_entity)
        .collect();

    let response = InstanceListResponse {
        data: instance_responses,
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

pub async fn create_instance(
    db: web::Data<DatabaseConnection>,
    instance: web::Json<InstanceCreateRequest>,
) -> Result<HttpResponse, ApiError> {
    // 生成雪花ID
    let instance_id = generate_snowflake_id();

    // 当前用户ID（从认证中间件获取，这里暂时使用系统用户）
    let current_user_id = "system".to_string();

    // 校验状态
    if !is_valid_status(instance.status.as_str()) {
        return Err(ApiError::BadRequest("Invalid status; must be 'active' or 'disabled'".to_string()));
    }

    // 转换为数据库实体
    let instance_data = instance.to_active_model(instance_id.clone(), current_user_id);

    // 保存到数据库
    let saved_instance = instance_data.insert(&**db).await?;

    // 转换为响应格式
    let response = InstanceResponse::from_entity(saved_instance);

    Ok(HttpResponse::Ok().json(response))
}

pub async fn get_instance(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>
) -> Result<HttpResponse, ApiError> {
    let instance_id = path.into_inner();

    // 从数据库查询实例
    let instance = Instances::find_by_id(&instance_id)
        .filter(crate::entities::instances::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    match instance {
        Some(instance) => {
            let response = InstanceResponse::from_entity(instance);
            Ok(HttpResponse::Ok().json(response))
        }
        None => Err(ApiError::NotFound("实例不存在".to_string())),
    }
}

pub async fn update_instance(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    instance: web::Json<InstanceCreateRequest>,
) -> Result<HttpResponse, ApiError> {
    let instance_id = path.into_inner();

    // 检查实例是否存在
    let existing_instance = Instances::find_by_id(&instance_id)
        .filter(crate::entities::instances::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_instance = match existing_instance {
        Some(instance) => instance,
        None => return Err(ApiError::NotFound("实例不存在".to_string())),
    };

    // 当前用户ID（从认证中间件获取，这里暂时使用系统用户）
    let current_user_id = "system".to_string();

    // 校验状态
    if !is_valid_status(instance.status.as_str()) {
        return Err(ApiError::BadRequest("Invalid status; must be 'active' or 'disabled'".to_string()));
    }

    // 更新实例信息
    let updated_instance = ActiveModel {
        id: Set(instance_id),
        status: Set(instance.status.clone()),
        environment: Set(instance.environment.clone()),
        application_id: Set(instance.application_id.clone()),
        mac_address: Set(instance.mac_address.clone()),
        public_ip: Set(instance.public_ip.clone()),
        port: Set(instance.port),
        program_path: Set(instance.program_path.clone()),
        os_type: Set(instance.os_type.clone()),
        os_version: Set(instance.os_version.clone()),
        custom_fields: Set(instance.custom_fields.clone()),
        updated_by: Set(current_user_id),
        revision: Set(existing_instance.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    let saved_instance = updated_instance.update(&**db).await?;
    let response = InstanceResponse::from_entity(saved_instance);

    Ok(HttpResponse::Ok().json(response))
}

pub async fn delete_instance(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>
) -> Result<HttpResponse, ApiError> {
    let instance_id = path.into_inner();

    // 检查实例是否存在
    let existing_instance = Instances::find_by_id(&instance_id)
        .filter(crate::entities::instances::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_instance = match existing_instance {
        Some(instance) => instance,
        None => return Err(ApiError::NotFound("实例不存在".to_string())),
    };

    // 当前用户ID（从认证中间件获取，这里暂时使用系统用户）
    let current_user_id = "system".to_string();

    // 软删除实例（设置 deleted_at 时间戳）
    let deleted_instance = ActiveModel {
        id: Set(instance_id),
        deleted_at: Set(Some(Utc::now().into())),
        updated_by: Set(current_user_id),
        revision: Set(existing_instance.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    deleted_instance.update(&**db).await?;

    Ok(HttpResponse::Ok().json("实例删除成功"))
}

pub async fn enable_instance(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let instance_id = path.into_inner();
    let user_id = get_user_id_from_request(&req)?;
    // 权限检查：需要具有 instance_management.enable 权限
    let permission = get_user_permission_by_name(&user_id.to_string(), "instance_management.enable", &db).await?;
    if permission.is_none() {
        return Err(ApiError::Forbidden("没有权限启用实例".to_string()));
    }
    let existing = Instances::find_by_id(&instance_id)
        .filter(crate::entities::instances::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;
    let instance = match existing { Some(i) => i, None => return Err(ApiError::NotFound("实例不存在".to_string())) };
    let mut active: ActiveModel = instance.into();
    active.status = Set("active".to_string());
    active.updated_by = Set(user_id.to_string());
    active.updated_at = Set(Utc::now().into());
    let saved = active.update(&**db).await?;
    let response = InstanceResponse::from_entity(saved);
    Ok(HttpResponse::Ok().json(response))
}

pub async fn disable_instance(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let instance_id = path.into_inner();
    let user_id = get_user_id_from_request(&req)?;
    // 权限检查：需要具有 instance_management.disable 权限
    let permission = get_user_permission_by_name(&user_id.to_string(), "instance_management.disable", &db).await?;
    if permission.is_none() {
        return Err(ApiError::Forbidden("没有权限禁用实例".to_string()));
    }
    let existing = Instances::find_by_id(&instance_id)
        .filter(crate::entities::instances::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;
    let instance = match existing { Some(i) => i, None => return Err(ApiError::NotFound("实例不存在".to_string())) };
    let mut active: ActiveModel = instance.into();
    active.status = Set("disabled".to_string());
    active.updated_by = Set(user_id.to_string());
    active.updated_at = Set(Utc::now().into());
    let saved = active.update(&**db).await?;
    let response = InstanceResponse::from_entity(saved);
    Ok(HttpResponse::Ok().json(response))
}

pub async fn get_instance_monitoring_data(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let instance_id = path.into_inner();

    // 验证实例是否存在
    let instance = Instances::find_by_id(&instance_id)
        .filter(crate::entities::instances::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if instance.is_none() {
        return Err(ApiError::NotFound("实例不存在".to_string()));
    }

    let response = InstanceMonitoringDataResponse {
        timestamp: Utc::now().to_rfc3339(),
    };

    Ok(HttpResponse::Ok().json(response))
}
