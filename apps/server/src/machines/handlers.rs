use crate::machines::models::{
    MachineCreateRequest, MachineListQuery, MachineListResponse, MachineMonitoringDataResponse,
    MachineResponse, NetworkTraffic, Pagination,
};
use crate::shared::error::ApiError;
use crate::shared::generate_snowflake_id;
use crate::entities::machines::{Entity as Machines, ActiveModel};
use actix_web::{web, HttpResponse, Result};
use chrono::Utc;
use uuid::Uuid;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, 
    PaginatorTrait, QueryFilter, QueryOrder, QuerySelect, Set
};

pub async fn get_machines(
    db: web::Data<DatabaseConnection>,
    query: web::Query<MachineListQuery>
) -> Result<HttpResponse, ApiError> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(10);
    let offset = (page - 1) * limit;

    // 构建查询条件
    let mut select = Machines::find()
        .filter(crate::entities::machines::Column::DeletedAt.is_null());

    // 添加搜索过滤器
    if let Some(search) = &query.search {
        select = select.filter(
            crate::entities::machines::Column::Name.contains(search)
                .or(crate::entities::machines::Column::Hostname.contains(search))
        );
    }

    // 添加状态过滤器
    if let Some(status) = &query.status {
        select = select.filter(crate::entities::machines::Column::Status.eq(status));
    }

    // 获取总数
    let total = select.clone().count(&**db).await?;

    // 获取分页数据
    let machines = select
        .order_by_desc(crate::entities::machines::Column::CreatedAt)
        .offset(offset as u64)
        .limit(limit as u64)
        .all(&**db)
        .await?;

    // 转换为响应格式
    let machine_responses: Vec<MachineResponse> = machines
        .into_iter()
        .map(MachineResponse::from_entity)
        .collect();

    let response = MachineListResponse {
        data: machine_responses,
        pagination: Pagination {
            page,
            limit,
            total: total as u32,
        },
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: Uuid::new_v4().to_string(),
    };

    Ok(HttpResponse::Ok().json(response))
}

pub async fn create_machine(
    db: web::Data<DatabaseConnection>,
    machine: web::Json<MachineCreateRequest>,
) -> Result<HttpResponse, ApiError> {
    // 生成雪花ID
    let machine_id = generate_snowflake_id()
        .map_err(|e| ApiError::InternalServerError(e))?;

    // 当前用户ID（从认证中间件获取，这里暂时使用系统用户）
    let current_user_id = "system".to_string();

    // 转换为数据库实体
    let machine_data = machine.to_active_model(machine_id.clone(), current_user_id);

    // 保存到数据库
    let saved_machine = machine_data.insert(&**db).await?;

    // 转换为响应格式
    let response = MachineResponse::from_entity(saved_machine);

    Ok(HttpResponse::Ok().json(response))
}

pub async fn get_machine(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>
) -> Result<HttpResponse, ApiError> {
    let machine_id = path.into_inner();

    // 从数据库查询机器
    let machine = Machines::find_by_id(&machine_id)
        .filter(crate::entities::machines::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    match machine {
        Some(machine) => {
            let response = MachineResponse::from_entity(machine);
            Ok(HttpResponse::Ok().json(response))
        }
        None => Err(ApiError::NotFound("机器不存在".to_string())),
    }
}

pub async fn update_machine(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    machine: web::Json<MachineCreateRequest>,
) -> Result<HttpResponse, ApiError> {
    let machine_id = path.into_inner();

    // 检查机器是否存在
    let existing_machine = Machines::find_by_id(&machine_id)
        .filter(crate::entities::machines::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_machine = match existing_machine {
        Some(machine) => machine,
        None => return Err(ApiError::NotFound("机器不存在".to_string())),
    };

    // 当前用户ID（从认证中间件获取，这里暂时使用系统用户）
    let current_user_id = "system".to_string();

    // 更新机器信息
    use serde_json::json;
    let specifications = json!({
        "deployment_id": machine.deployment_id,
        "application_id": machine.application_id
    });

    let updated_machine = ActiveModel {
        id: Set(machine_id),
        name: Set(machine.name.clone()),
        status: Set(machine.status.clone()),
        specifications: Set(specifications),
        environment: Set(machine.machine_type.clone()),
        updated_by: Set(current_user_id),
        revision: Set(existing_machine.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    let saved_machine = updated_machine.update(&**db).await?;
    let response = MachineResponse::from_entity(saved_machine);

    Ok(HttpResponse::Ok().json(response))
}

pub async fn delete_machine(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>
) -> Result<HttpResponse, ApiError> {
    let machine_id = path.into_inner();

    // 检查机器是否存在
    let existing_machine = Machines::find_by_id(&machine_id)
        .filter(crate::entities::machines::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_machine = match existing_machine {
        Some(machine) => machine,
        None => return Err(ApiError::NotFound("机器不存在".to_string())),
    };

    // 当前用户ID（从认证中间件获取，这里暂时使用系统用户）
    let current_user_id = "system".to_string();

    // 软删除机器（设置 deleted_at 时间戳）
    let deleted_machine = ActiveModel {
        id: Set(machine_id),
        deleted_at: Set(Some(Utc::now().into())),
        updated_by: Set(current_user_id),
        revision: Set(existing_machine.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    deleted_machine.update(&**db).await?;

    Ok(HttpResponse::Ok().json("机器删除成功"))
}

pub async fn get_machine_monitoring_data(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let machine_id = path.into_inner();

    // 验证机器是否存在
    let machine = Machines::find_by_id(&machine_id)
        .filter(crate::entities::machines::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if machine.is_none() {
        return Err(ApiError::NotFound("机器不存在".to_string()));
    }

    // 实际实现时，这里应该从监控系统获取实时数据
    // 目前返回模拟数据
    use rand::Rng;
    let mut rng = rand::thread_rng();
    
    let response = MachineMonitoringDataResponse {
        cpu_usage: rng.gen_range(10.0..90.0),
        memory_usage: rng.gen_range(20.0..80.0),
        disk_usage: rng.gen_range(30.0..95.0),
        network_traffic: NetworkTraffic {
            incoming: rng.gen_range(100.0..2000.0),
            outgoing: rng.gen_range(50.0..1500.0),
        },
        timestamp: Utc::now().to_rfc3339(),
    };

    Ok(HttpResponse::Ok().json(response))
}
