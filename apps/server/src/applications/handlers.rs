use crate::applications::models::{ApplicationCreateRequest, ApplicationListQuery, ApplicationListResponse, ApplicationResponse, AuthorizationResponse, Pagination};
use crate::applications::ApplicationsModule;
use crate::auth::middleware::get_user_id_from_request;
use crate::entities::applications::Entity as Applications;
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use actix_web::{web, HttpRequest, HttpResponse};
use sea_orm::{ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect};
use chrono::Utc;

#[utoipa::path(
    get,
    path = "/api/applications",
    params(ApplicationListQuery),
    responses(
        (status = 200, description = "List applications successfully", body = ApplicationListResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Applications"
)]
pub async fn get_applications(
    db: web::Data<DatabaseConnection>,
    query: web::Query<ApplicationListQuery>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 从JWT中获取用户ID
    let _user_id = get_user_id_from_request(&req)?;

    // 分页参数处理
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(10);
    let offset = (page - 1) * limit;

    let mut select = Applications::find().filter(crate::entities::applications::Column::DeletedAt.is_null());

    // 搜索过滤：名称、编码、描述（任意匹配）
    if let Some(search) = &query.search {
        let search_pattern = format!("%{}%", search);
        select = select.filter(
            crate::entities::applications::Column::Name
                .like(&search_pattern)
                .or(crate::entities::applications::Column::Code.like(&search_pattern))
                .or(crate::entities::applications::Column::Description.like(&search_pattern)),
        );
    }

    // 状态过滤
    if let Some(status) = &query.status {
        select = select.filter(crate::entities::applications::Column::Status.eq(status));
    }

    // 排序
    select = select.order_by_desc(crate::entities::applications::Column::CreatedAt);

    // 获取总数和分页数据
    let total = select.clone().count(&**db).await.map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;
    let applications: Vec<crate::entities::applications::Model> = select
        .offset(offset as u64)
        .limit(limit as u64)
        .all(&**db)
        .await
        .map_err(|e: sea_orm::DbErr| ApiError::DatabaseError(e.to_string()))?;

    // 转换为响应格式
    let application_responses: Vec<ApplicationResponse> = applications
        .into_iter()
        .map(|app| ApplicationResponse {
            id: app.id,
            project_id: app.project_id,
            name: app.name,
            code: app.code,
            status: app.status,
            description: app.description.unwrap_or_default(),
            authorization: AuthorizationResponse {
                users: vec![app.created_by],
                expiry_date: None,
            },
            created_at: app.created_at.to_rfc3339(),
            updated_at: app.updated_at.to_rfc3339(),
        })
        .collect();

    let response = ApplicationListResponse {
        data: application_responses,
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

#[utoipa::path(
    post,
    path = "/api/applications",
    request_body = ApplicationCreateRequest,
    responses(
        (status = 200, description = "Application created successfully", body = ApplicationResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Applications"
)]
pub async fn create_application(
    db: web::Data<DatabaseConnection>,
    app: web::Json<ApplicationCreateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 从JWT中获取用户ID
    let user_id = get_user_id_from_request(&req)?;

    // 验证请求数据
    if app.name.is_empty() || app.code.is_empty() {
        return Err(ApiError::BadRequest("Name and code are required".to_string()));
    }

    // 创建ApplicationsModule实例
    let applications_module = ApplicationsModule::new(db.get_ref().clone());

    // 检查应用名称是否已存在
    if let Some(existing_app) = applications_module.find_application_by_name(&app.name).await? {
        return Err(ApiError::BadRequest(format!("应用名称已存在：{}", existing_app.name)));
    }

    // 新增：检查应用编码是否已存在
    if let Some(existing_app) = applications_module.find_application_by_code(&app.code).await? {
        return Err(ApiError::BadRequest(format!("应用代码已存在：{}", existing_app.name)));
    }

    // 创建应用
    let new_app = crate::entities::applications::ActiveModel {
        id: ActiveValue::Set(generate_snowflake_id()),
        project_id: ActiveValue::Set(app.project_id.clone()),
        name: ActiveValue::Set(app.name.clone()),
        code: ActiveValue::Set(app.code.clone()),
        status: ActiveValue::Set(app.status.clone()),
        description: ActiveValue::Set(Some(app.description.clone())),
        auth_config: ActiveValue::Set(serde_json::Value::Null),
        revision: ActiveValue::Set(1),
        deleted_at: ActiveValue::Set(None),
        created_by: ActiveValue::Set(user_id.to_string()),
        updated_by: ActiveValue::Set(user_id.to_string()),
        created_at: ActiveValue::Set(Utc::now().into()),
        updated_at: ActiveValue::Set(Utc::now().into()),
    };

    let created_app = applications_module.create_application(new_app).await?;

    // 转换为响应格式
    let response = ApplicationResponse {
        id: created_app.id,
        project_id: created_app.project_id,
        name: created_app.name,
        code: created_app.code,
        status: created_app.status,
        description: created_app.description.unwrap_or_default(),
        authorization: AuthorizationResponse {
            users: vec![created_app.created_by],
            expiry_date: None,
        },
        created_at: created_app.created_at.to_rfc3339(),
        updated_at: created_app.updated_at.to_rfc3339(),
    };

    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    get,
    path = "/api/applications/{id}",
    params(
        ("id" = String, Path, description = "Application ID")
    ),
    responses(
        (status = 200, description = "Application found successfully", body = ApplicationResponse),
        (status = 404, description = "Application not found"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Applications"
)]
pub async fn get_application(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 从JWT中获取用户ID
    let user_id = get_user_id_from_request(&req)?;

    let app_id = path.into_inner();

    // 创建ApplicationsModule实例
    let applications_module = ApplicationsModule::new(db.get_ref().clone());

    // 查询数据库获取应用信息
    if let Some(application) = applications_module.find_application_by_id(&app_id).await? {
        // 检查用户是否有访问权限
        if application.created_by != user_id.to_string() {
            return Err(ApiError::Unauthorized("You do not have permission to access this application".to_string()));
        }

        // 转换为响应格式
        let response = ApplicationResponse {
            id: application.id,
            project_id: application.project_id,
            name: application.name,
            code: application.code,
            status: application.status,
            description: application.description.unwrap_or_default(),
            authorization: AuthorizationResponse {
                users: vec![application.created_by],
                expiry_date: None,
            },
            created_at: application.created_at.to_rfc3339(),
            updated_at: application.updated_at.to_rfc3339(),
        };

        Ok(HttpResponse::Ok().json(response))
    } else {
        Err(ApiError::NotFound("Application not found".to_string()))
    }
}

#[utoipa::path(
    put,
    path = "/api/applications/{id}",
    params(
        ("id" = String, Path, description = "Application ID")
    ),
    request_body = ApplicationCreateRequest,
    responses(
        (status = 200, description = "Application updated successfully", body = ApplicationResponse),
        (status = 404, description = "Application not found"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Applications"
)]
pub async fn update_application(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    app: web::Json<ApplicationCreateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 从JWT中获取用户ID
    let user_id = get_user_id_from_request(&req)?;

    let app_id = path.into_inner();

    // 创建ApplicationsModule实例
    let applications_module = ApplicationsModule::new(db.get_ref().clone());

    // 验证请求数据
    if app.name.is_empty() || app.code.is_empty() {
        return Err(ApiError::BadRequest("Name and code are required".to_string()));
    }

    // 查询数据库获取应用信息
    if let Some(mut application) = applications_module.find_application_by_id(&app_id).await? {
        // 检查用户是否有更新权限
        if application.created_by != user_id.to_string() {
            return Err(ApiError::Unauthorized("You do not have permission to update this application".to_string()));
        }

        // 新增：检查编码是否被其他应用使用（排除当前记录）
        if let Some(existing_app) = applications_module.find_application_by_code(&app.code).await? {
            if existing_app.id != app_id {
                return Err(ApiError::BadRequest(format!("应用代码已存在：{}", existing_app.name)));
            }
        }

        // 更新应用信息
        application.name = app.name.clone();
        application.project_id = app.project_id.clone();
        application.code = app.code.clone();
        application.status = app.status.clone();
        application.description = Some(app.description.clone());
        application.updated_by = user_id.to_string();
        application.revision = application.revision + 1;
        application.updated_at = Utc::now().into();

        // 保存更新
        let updated_app = applications_module.update_application(application.into()).await?;

        // 转换为响应格式
        let response = ApplicationResponse {
            id: updated_app.id,
            project_id: updated_app.project_id,
            name: updated_app.name,
            code: updated_app.code,
            status: updated_app.status,
            description: updated_app.description.unwrap_or_default(),
            authorization: AuthorizationResponse {
                users: vec![updated_app.created_by],
                expiry_date: None,
            },
            created_at: updated_app.created_at.to_rfc3339(),
            updated_at: updated_app.updated_at.to_rfc3339(),
        };

        Ok(HttpResponse::Ok().json(response))
    } else {
        Err(ApiError::NotFound("Application not found".to_string()))
    }
}

#[utoipa::path(
    delete,
    path = "/api/applications/{id}",
    params(
        ("id" = String, Path, description = "Application ID")
    ),
    responses(
        (status = 200, description = "Application deleted successfully"),
        (status = 404, description = "Application not found"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Applications"
)]
pub async fn delete_application(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 从JWT中获取用户ID
    let user_id = get_user_id_from_request(&req)?;

    let app_id = path.into_inner();

    // 创建ApplicationsModule实例
    let applications_module = ApplicationsModule::new(db.get_ref().clone());

    // 查询数据库获取应用信息
    if let Some(application) = applications_module.find_application_by_id(&app_id).await? {
        // 检查用户是否有删除权限
        if application.created_by != user_id.to_string() {
            return Err(ApiError::Unauthorized("You do not have permission to delete this application".to_string()));
        }

        // 删除应用
        applications_module.delete_application(&app_id).await?;

        Ok(HttpResponse::Ok().json("Application deleted successfully"))
    } else {
        Err(ApiError::NotFound("Application not found".to_string()))
    }
}
