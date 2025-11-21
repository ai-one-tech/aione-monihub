use crate::applications::models::{
    ApplicationCreateRequest, ApplicationListQuery, ApplicationListResponse, ApplicationResponse,
    Pagination,
};
use crate::applications::ApplicationsModule;
use crate::auth::middleware::get_user_id_from_request;
use crate::entities::applications::Entity as Applications;
use crate::permissions::handlers::get_user_permission_by_name;
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use crate::shared::enums::Status;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait,
    QueryFilter, QueryOrder, QuerySelect,
};
use sea_orm::prelude::Expr;
use crate::shared::error::db_error_here_with_context;

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

    let mut select =
        Applications::find().filter(crate::entities::applications::Column::DeletedAt.is_null());

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

    // 技术栈过滤：将 JSONB 转为 TEXT，再进行不区分大小写的模糊匹配
    if let Some(stack) = &query.tech_stack {
        select = select.filter(
            Expr::cust(format!(
                "EXISTS (SELECT 1 FROM jsonb_array_elements(tech_stacks) AS elem WHERE elem->>'name' = '{}')",
                stack
            ))
        );
    }

    // 状态过滤
    if let Some(status) = &query.status {
        select = select.filter(crate::entities::applications::Column::Status.eq(status));
    }

    // 排序
    select = select.order_by_desc(crate::entities::applications::Column::CreatedAt);

    let filter_loc = if query.tech_stack.is_some() { Some(format!("{}:{}", file!(), line!())) } else { None };
    let ctx = filter_loc.map(|l| format!("applications.get_applications tech_stack filter at {}", l)).unwrap_or_else(|| "applications.get_applications".to_string());
    let total = select
        .clone()
        .count(&**db)
        .await
        .map_err(|e: sea_orm::DbErr| db_error_here_with_context(e, &ctx))?;
    let applications: Vec<crate::entities::applications::Model> = select
        .offset(offset as u64)
        .limit(limit as u64)
        .all(&**db)
        .await
        .map_err(|e: sea_orm::DbErr| db_error_here_with_context(e, &ctx))?;

    // 转换为响应格式
    let application_responses: Vec<ApplicationResponse> = applications
        .into_iter()
        .map(|app| {
            let tech_stacks: Vec<crate::applications::models::TechStackKV> = match serde_json::from_value(app.tech_stacks.clone()) {
                Ok(v) => v,
                Err(_) => Vec::new(),
            };
            ApplicationResponse {
                id: app.id,
                project_id: app.project_id,
                name: app.name,
                code: app.code,
                status: app.status,
                description: app.description.unwrap_or_default(),
                tech_stacks,
                created_at: app.created_at.to_rfc3339(),
                updated_at: app.updated_at.to_rfc3339(),
            }
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
        return Err(ApiError::BadRequest(
            "Name and code are required".to_string(),
        ));
    }

    // 创建ApplicationsModule实例
    let applications_module = ApplicationsModule::new(db.get_ref().clone());

    // 检查应用名称是否已存在
    if let Some(existing_app) = applications_module
        .find_application_by_name(&app.name)
        .await?
    {
        return Err(ApiError::BadRequest(format!(
            "应用名称已存在：{}",
            existing_app.name
        )));
    }

    // 新增：检查应用编码是否已存在
    if let Some(existing_app) = applications_module
        .find_application_by_code(&app.code)
        .await?
    {
        return Err(ApiError::BadRequest(format!(
            "应用代码已存在：{}",
            existing_app.name
        )));
    }

    // 创建应用
    let new_app = crate::entities::applications::ActiveModel {
        id: ActiveValue::Set(generate_snowflake_id()),
        project_id: ActiveValue::Set(app.project_id.clone()),
        name: ActiveValue::Set(app.name.clone()),
        code: ActiveValue::Set(app.code.clone()),
        status: ActiveValue::Set(match app.status.as_str() { "active" => Status::Active, "disabled" => Status::Disabled, _ => Status::Disabled }),
        description: ActiveValue::Set(Some(app.description.clone())),
        auth_config: ActiveValue::Set(serde_json::Value::Null),
        tech_stacks: ActiveValue::Set(serde_json::to_value(app.tech_stacks.clone().unwrap_or_default()).unwrap_or(serde_json::Value::Null)),
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
        tech_stacks: serde_json::from_value(created_app.tech_stacks.clone()).unwrap_or_default(),
        created_at: created_app.created_at.to_rfc3339(),
        updated_at: created_app.updated_at.to_rfc3339(),
    };

    // 审计记录：新增应用
    let after = serde_json::json!({
        "id": response.id,
        "project_id": response.project_id,
        "name": response.name,
        "code": response.code,
        "status": response.status,
        "tech_stacks": response.tech_stacks,
        "description": response.description,
        "created_at": response.created_at,
        "updated_at": response.updated_at,
    });
    let _ = crate::shared::request_context::record_audit_log_simple(
        db.get_ref(),
        "applications",
        "create",
        &req,
        None,
        Some(after),
    ).await;

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
            return Err(ApiError::Unauthorized(
                "You do not have permission to access this application".to_string(),
            ));
        }

        // 转换为响应格式
        let response = ApplicationResponse {
            id: application.id,
            project_id: application.project_id,
            name: application.name,
            code: application.code,
            status: application.status,
            description: application.description.unwrap_or_default(),
            tech_stacks: serde_json::from_value(application.tech_stacks.clone()).unwrap_or_default(),
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
        return Err(ApiError::BadRequest(
            "Name and code are required".to_string(),
        ));
    }
    // 查询数据库获取应用信息
    if let Some(application) = applications_module.find_application_by_id(&app_id).await? {
        // 检查用户是否有更新权限
        if application.created_by != user_id.to_string() {
            return Err(ApiError::Unauthorized(
                "You do not have permission to update this application".to_string(),
            ));
        }

        // 新增：检查编码是否被其他应用使用（排除当前记录）
        if let Some(existing_app) = applications_module
            .find_application_by_code(&app.code)
            .await?
        {
            if existing_app.id != app_id {
                return Err(ApiError::BadRequest(format!(
                    "应用代码已存在：{}",
                    existing_app.name
                )));
            }
        }

        // 转换为 ActiveModel 并更新字段
        let application_before = application.clone();
        let mut active_app: crate::entities::applications::ActiveModel = application.into();
        active_app.name = ActiveValue::Set(app.name.clone());
        active_app.project_id = ActiveValue::Set(app.project_id.clone());
        active_app.code = ActiveValue::Set(app.code.clone());
        active_app.status = ActiveValue::Set(match app.status.as_str() { "active" => Status::Active, "disabled" => Status::Disabled, _ => Status::Disabled });
        active_app.description = ActiveValue::Set(Some(app.description.clone()));
        active_app.tech_stacks = ActiveValue::Set(serde_json::to_value(app.tech_stacks.clone().unwrap_or_default()).unwrap_or(serde_json::Value::Null));
        active_app.updated_by = ActiveValue::Set(user_id.to_string());
        active_app.updated_at = ActiveValue::Set(Utc::now().into());

        // 保存更新
        let updated_app = applications_module.update_application(active_app).await?;

        // 转换为响应格式
        let response = ApplicationResponse {
            id: updated_app.id,
            project_id: updated_app.project_id,
            name: updated_app.name,
            code: updated_app.code,
            status: updated_app.status,
            description: updated_app.description.unwrap_or_default(),
            tech_stacks: serde_json::from_value(updated_app.tech_stacks.clone()).unwrap_or_default(),
            created_at: updated_app.created_at.to_rfc3339(),
            updated_at: updated_app.updated_at.to_rfc3339(),
        };

        // 审计记录：更新应用
        let before = serde_json::json!({
            "id": application_before.id,
            "project_id": application_before.project_id,
            "name": application_before.name,
            "code": application_before.code,
            "status": application_before.status,
            "description": application_before.description.unwrap_or_default(),
            "created_at": application_before.created_at.to_rfc3339(),
            "updated_at": application_before.updated_at.to_rfc3339(),
        });
        let after = serde_json::json!({
            "id": response.id,
            "project_id": response.project_id,
            "name": response.name,
            "code": response.code,
            "status": response.status,
            "description": response.description,
            "created_at": response.created_at,
            "updated_at": response.updated_at,
        });
        let _ = crate::shared::request_context::record_audit_log_simple(
            db.get_ref(),
            "applications",
            "update",
            &req,
            Some(before),
            Some(after),
        ).await;

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
            return Err(ApiError::Unauthorized(
                "You do not have permission to delete this application".to_string(),
            ));
        }

        // 删除应用
        applications_module.delete_application(&app_id).await?;

        // 审计记录：删除应用
        let before = serde_json::json!({
            "id": application.id,
            "project_id": application.project_id,
            "name": application.name,
            "code": application.code,
            "status": application.status,
            "description": application.description.unwrap_or_default(),
            "created_at": application.created_at.to_rfc3339(),
            "updated_at": application.updated_at.to_rfc3339(),
        });
        let _ = crate::shared::request_context::record_audit_log_simple(
            db.get_ref(),
            "applications",
            "delete",
            &req,
            Some(before),
            None,
        ).await;

        Ok(HttpResponse::Ok().json("Application deleted successfully"))
    } else {
        Err(ApiError::NotFound("Application not found".to_string()))
    }
}

#[utoipa::path(
    post,
    path = "/api/applications/{id}/enable",
    params(("id" = String, Path, description = "Application ID")),
    responses((status = 200, description = "Application enabled successfully", body = ApplicationResponse), (status = 404, description = "Application not found")),
    tag = "Applications"
)]
pub async fn enable_application(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = get_user_id_from_request(&req)?;
    // 权限检查：需要具有 application_management.enable 权限
    let permission =
        get_user_permission_by_name(&user_id.to_string(), "application_management.enable", &db)
            .await?;
    if permission.is_none() {
        return Err(ApiError::Forbidden("没有权限启用应用".to_string()));
    }
    let app_id = path.into_inner();
    let module = ApplicationsModule::new(db.get_ref().clone());

    if let Some(app) = module.find_application_by_id(&app_id).await? {
        let mut active: crate::entities::applications::ActiveModel = app.into();
        active.status = ActiveValue::Set(Status::Active);
        active.updated_by = ActiveValue::Set(user_id.to_string());
        active.updated_at = ActiveValue::Set(Utc::now().into());
        let saved = active.update(db.get_ref()).await?;
        let response = ApplicationResponse {
            id: saved.id,
            project_id: saved.project_id,
            name: saved.name,
            code: saved.code,
            status: saved.status,
            description: saved.description.unwrap_or_default(),
            tech_stacks: serde_json::from_value(saved.tech_stacks.clone()).unwrap_or_default(),
            created_at: saved.created_at.to_rfc3339(),
            updated_at: saved.updated_at.to_rfc3339(),
        };
        // 审计记录：启用应用（作为更新）
        let before = serde_json::json!({ "status": Status::Disabled });
        let after = serde_json::json!({ "status": Status::Active });
        let _ = crate::shared::request_context::record_audit_log_simple(
            db.get_ref(),
            "applications",
            "update",
            &req,
            Some(before),
            Some(after),
        ).await;
        Ok(HttpResponse::Ok().json(response))
    } else {
        Err(ApiError::NotFound("Application not found".to_string()))
    }
}

#[utoipa::path(
    post,
    path = "/api/applications/{id}/disable",
    params(("id" = String, Path, description = "Application ID")),
    responses((status = 200, description = "Application disabled successfully", body = ApplicationResponse), (status = 404, description = "Application not found")),
    tag = "Applications"
)]
pub async fn disable_application(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = get_user_id_from_request(&req)?;
    // 权限检查：需要具有 application_management.disable 权限
    let permission =
        get_user_permission_by_name(&user_id.to_string(), "application_management.disable", &db)
            .await?;
    if permission.is_none() {
        return Err(ApiError::Forbidden("没有权限禁用应用".to_string()));
    }
    let app_id = path.into_inner();
    let module = ApplicationsModule::new(db.get_ref().clone());

    if let Some(app) = module.find_application_by_id(&app_id).await? {
        let mut active: crate::entities::applications::ActiveModel = app.into();
        active.status = ActiveValue::Set(Status::Disabled);
        active.updated_by = ActiveValue::Set(user_id.to_string());
        active.updated_at = ActiveValue::Set(Utc::now().into());
        let saved = active.update(db.get_ref()).await?;
        let response = ApplicationResponse {
            id: saved.id,
            project_id: saved.project_id,
            name: saved.name,
            code: saved.code,
            status: saved.status,
            description: saved.description.unwrap_or_default(),
            tech_stacks: serde_json::from_value(saved.tech_stacks.clone()).unwrap_or_default(),
            created_at: saved.created_at.to_rfc3339(),
            updated_at: saved.updated_at.to_rfc3339(),
        };
        // 审计记录：禁用应用（作为更新）
        let before = serde_json::json!({ "status": Status::Active });
        let after = serde_json::json!({ "status": Status::Disabled });
        let _ = crate::shared::request_context::record_audit_log_simple(
            db.get_ref(),
            "applications",
            "update",
            &req,
            Some(before),
            Some(after),
        ).await;
        Ok(HttpResponse::Ok().json(response))
    } else {
        Err(ApiError::NotFound("Application not found".to_string()))
    }
}
