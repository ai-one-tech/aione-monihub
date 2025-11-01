use crate::entities::projects::{ActiveModel, Entity as Projects};
use crate::entities::applications::Entity as Applications;
use crate::projects::models::{
    Pagination, ProjectCreateRequest, ProjectListQuery, ProjectListResponse, ProjectResponse,
};
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use crate::auth::middleware::get_user_id_from_request;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use chrono::Utc;
use serde_json::json;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, QuerySelect, Set,
};

#[utoipa::path(
    get,
    path = "/api/projects",
    params(
        ProjectListQuery
    ),
    responses(
        (status = 200, description = "List projects successfully", body = ProjectListResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Projects"
)]
pub async fn get_projects(
    db: web::Data<DatabaseConnection>,
    query: web::Query<ProjectListQuery>,
) -> Result<HttpResponse, ApiError> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(10);
    let offset = (page - 1) * limit;

    // 构建查询
    let mut select = Projects::find();

    // 如果有搜索关键词，按名称、编码、描述搜索（任意匹配）
    if let Some(search) = &query.search {
        if !search.is_empty() {
            let search_pattern = format!("%{}%", search);
            select = select.filter(
                crate::entities::projects::Column::Name
                    .like(&search_pattern)
                    .or(crate::entities::projects::Column::Code.like(&search_pattern))
                    .or(crate::entities::projects::Column::Description.like(&search_pattern)),
            );
        }
    }

    // 如果有状态筛选，按状态过滤
    if let Some(status) = &query.status {
        if !status.is_empty() {
            select = select.filter(
                crate::entities::projects::Column::Status.eq(status)
            );
        }
    }

    // 按创建时间倒序排列
    select = select.order_by_desc(crate::entities::projects::Column::CreatedAt);

    // 获取总数
    let total = select.clone().count(&**db).await?;

    // 分页查询
    let projects = select
        .offset(offset as u64)
        .limit(limit as u64)
        .all(&**db)
        .await?;

    // 转换为响应格式
    let project_responses: Vec<ProjectResponse> = projects
        .into_iter()
        .map(|project| ProjectResponse {
            id: project.id,
            name: project.name,
            code: project.code,
            status: project.status,
            description: project.description.unwrap_or_default(),
            created_at: project.created_at.to_rfc3339(),
            updated_at: project.updated_at.to_rfc3339(),
        })
        .collect();

    let response = ProjectListResponse {
        data: project_responses,
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
    path = "/api/projects",
    request_body = ProjectCreateRequest,
    responses(
        (status = 200, description = "Project created successfully", body = ProjectResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Projects"
)]
pub async fn create_project(
    db: web::Data<DatabaseConnection>,
    project: web::Json<ProjectCreateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 检查项目代码是否已存在
    let existing_project = Projects::find()
        .filter(crate::entities::projects::Column::Code.eq(&project.code))
        .one(&**db)
        .await?;

    if let Some(p) = existing_project {
        return Err(ApiError::BadRequest(format!("项目代码已存在：{}", p.name)));
    }

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 生成雪花ID
    let project_id = generate_snowflake_id();

    // 创建项目
    let new_project = ActiveModel {
        id: Set(project_id.clone()),
        name: Set(project.name.clone()),
        code: Set(project.code.clone()),
        status: Set(project.status.clone()),
        description: Set(Some(project.description.clone())),
        created_by: Set(current_user_id.to_string()),
        updated_by: Set(current_user_id.to_string()),
        deleted_at: Set(None),
        revision: Set(1),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };

    let saved_project = new_project.insert(&**db).await?;

    let response = ProjectResponse {
        id: saved_project.id,
        name: saved_project.name,
        code: saved_project.code,
        status: saved_project.status,
        description: saved_project.description.unwrap_or_default(),
        created_at: saved_project.created_at.to_rfc3339(),
        updated_at: saved_project.updated_at.to_rfc3339(),
    };

    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    get,
    path = "/api/projects/{project_id}",
    params(
        ("project_id" = String, Path, description = "Project ID")
    ),
    responses(
        (status = 200, description = "Project found successfully", body = ProjectResponse),
        (status = 404, description = "Project not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Projects"
)]
pub async fn get_project(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let project_id = path.into_inner();

    let project = Projects::find_by_id(project_id)
        .one(&**db)
        .await?;

    match project {
        Some(project) => {
            let response = ProjectResponse {
                id: project.id,
                name: project.name,
                code: project.code,
                status: project.status,
                description: project.description.unwrap_or_default(),
                created_at: project.created_at.to_rfc3339(),
                updated_at: project.updated_at.to_rfc3339(),
            };
            Ok(HttpResponse::Ok().json(response))
        }
        None => Err(ApiError::NotFound("项目不存在".to_string())),
    }
}

#[utoipa::path(
    put,
    path = "/api/projects/{project_id}",
    params(
        ("project_id" = String, Path, description = "Project ID")
    ),
    request_body = ProjectCreateRequest,
    responses(
        (status = 200, description = "Project updated successfully", body = ProjectResponse),
        (status = 404, description = "Project not found"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Projects"
)]
pub async fn update_project(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    project: web::Json<ProjectCreateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let project_id = path.into_inner();

    // 查找项目
    let existing_project = Projects::find_by_id(&project_id)
        .one(&**db)
        .await?;

    let _existing_project = match existing_project {
        Some(project) => project,
        None => return Err(ApiError::NotFound("项目不存在".to_string())),
    };

    // 新增：检查编码是否被其他项目使用（排除当前记录）
    if let Some(p) = Projects::find()
        .filter(crate::entities::projects::Column::Code.eq(&project.code))
        .filter(crate::entities::projects::Column::Id.ne(&project_id))
        .one(&**db)
        .await? {
        return Err(ApiError::BadRequest(format!("项目代码已存在：{}", p.name)));
    }

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 更新项目
    let updated_project = ActiveModel {
        id: Set(project_id),
        name: Set(project.name.clone()),
        code: Set(project.code.clone()),
        status: Set(project.status.clone()),
        description: Set(Some(project.description.clone())),
        updated_by: Set(current_user_id.to_string()),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    let saved_project = updated_project.update(&**db).await?;

    let response = ProjectResponse {
        id: saved_project.id,
        name: saved_project.name,
        code: saved_project.code,
        status: saved_project.status,
        description: saved_project.description.unwrap_or_default(),
        created_at: saved_project.created_at.to_rfc3339(),
        updated_at: saved_project.updated_at.to_rfc3339(),
    };

    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    delete,
    path = "/api/projects/{project_id}",
    params(
        ("project_id" = String, Path, description = "Project ID")
    ),
    responses(
        (status = 200, description = "Project deleted successfully"),
        (status = 400, description = "Project has linked applications"),
        (status = 404, description = "Project not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Projects"
)]
pub async fn delete_project(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let project_id = path.into_inner();

    // 查找项目
    let existing_project = Projects::find_by_id(&project_id)
        .one(&**db)
        .await?;

    let _existing_project = match existing_project {
        Some(project) => project,
        None => return Err(ApiError::NotFound("项目不存在".to_string())),
    };

    // 检查是否存在未删除的关联应用
    let linked_apps = Applications::find()
        .filter(crate::entities::applications::Column::ProjectId.eq(&project_id))
        .filter(crate::entities::applications::Column::DeletedAt.is_null())
        .all(&**db)
        .await?;

    if !linked_apps.is_empty() {
        let app_names: Vec<String> = linked_apps.into_iter().map(|app| app.name).collect();
        let joined_names = app_names.join(", ");
        return Ok(HttpResponse::BadRequest().json(json!({
            "message": format!("该项目已被以下应用关联 {}", joined_names),
            "applications": app_names
        })));
    }

    // 软删除项目（设置deleted_at时间戳）
    let updated_project = ActiveModel {
        id: Set(project_id),
        deleted_at: Set(Some(Utc::now().into())),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    updated_project.update(&**db).await?;

    Ok(HttpResponse::Ok().json("项目删除成功"))
}
