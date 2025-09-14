use crate::auth::middleware::get_user_id_from_request;
use crate::permissions::handlers::{get_user_permissions_by_type, PermissionListResponse};
use crate::permissions::PermissionsModule;
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use crate::users::models::{
    Pagination, UserCreateRequest, UserListQuery, UserListResponse, UserResponse,
};
use actix_web::{web, HttpResponse, Result};
use bcrypt::{hash, DEFAULT_COST};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, QuerySelect, Set,
};
use uuid::Uuid;

#[utoipa::path(
    get,
    path = "/api/users",
    params(
        UserListQuery
    ),
    responses(
        (status = 200, description = "List users successfully", body = UserListResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Users"
)]
pub async fn get_users(
    db: web::Data<DatabaseConnection>,
    query: web::Query<UserListQuery>,
) -> Result<HttpResponse, ApiError> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(10);
    let offset = (page - 1) * limit;

    let mut select = Users::find().filter(crate::entities::users::Column::DeletedAt.is_null());

    // 搜索过滤
    if let Some(search) = &query.search {
        let search_pattern = format!("%{}%", search);
        select = select.filter(
            crate::entities::users::Column::Username
                .like(&search_pattern)
                .or(crate::entities::users::Column::Email.like(&search_pattern)),
        );
    }

    // 状态过滤
    if let Some(status) = &query.status {
        select = select.filter(crate::entities::users::Column::Status.eq(status));
    }

    // 排序
    select = select.order_by_desc(crate::entities::users::Column::CreatedAt);

    // 获取总数和分页数据
    let total = select.clone().count(&**db).await?;
    let users: Vec<UserModel> = select
        .offset(offset as u64)
        .limit(limit as u64)
        .all(&**db)
        .await?;

    // 转换为响应格式
    let user_responses: Vec<UserResponse> = users
        .into_iter()
        .map(|user| UserResponse {
            id: user.id,
            username: user.username,
            email: user.email,
            status: user.status,
            created_at: user.created_at.to_rfc3339(),
            updated_at: user.updated_at.to_rfc3339(),
        })
        .collect();

    let response = UserListResponse {
        data: user_responses,
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

#[utoipa::path(
    post,
    path = "/api/users",
    request_body = UserCreateRequest,
    responses(
        (status = 200, description = "User created successfully", body = UserResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Users"
)]
pub async fn create_user(
    db: web::Data<DatabaseConnection>,
    user: web::Json<UserCreateRequest>,
    req: web::HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 检查用户名是否已存在
    let existing_user = Users::find()
        .filter(crate::entities::users::Column::Username.eq(&user.username))
        .filter(crate::entities::users::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if existing_user.is_some() {
        return Err(ApiError::BadRequest("用户名已存在".to_string()));
    }

    // 检查邮箱是否已存在
    let existing_email = Users::find()
        .filter(crate::entities::users::Column::Email.eq(&user.email))
        .filter(crate::entities::users::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if existing_email.is_some() {
        return Err(ApiError::BadRequest("邮箱已存在".to_string()));
    }

    // 生成雪花ID
    let user_id = generate_snowflake_id().map_err(|e| ApiError::InternalServerError(e))?;

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(req.request())?;

    // 验证当前用户是否有创建用户的权限
    let permissions = get_user_permissions_by_type(&current_user_id.to_string(), "user_management", &db).await?;
    let has_permission = permissions.iter().any(|p| p.name == "user_management.create");
    if !has_permission {
        return Err(ApiError::Forbidden("没有权限创建用户".to_string()));
    }

    // 密码加密
    let password_hash = hash(&user.password, DEFAULT_COST)
        .map_err(|e| ApiError::InternalServerError(format!("密码加密失败: {}", e)))?;

    // 创建用户
    let new_user = ActiveModel {
        id: Set(user_id.clone()),
        username: Set(user.username.clone()),
        email: Set(user.email.clone()),
        password_hash: Set(password_hash),
        status: Set(user.status.clone()),
        created_by: Set(current_user_id.to_string()),
        updated_by: Set(current_user_id.to_string()),
        revision: Set(1),
        deleted_at: Set(None),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };

    let saved_user = new_user.insert(&**db).await?;

    let response = UserResponse {
        id: saved_user.id,
        username: saved_user.username,
        email: saved_user.email,
        status: saved_user.status,
        created_at: saved_user.created_at.to_rfc3339(),
        updated_at: saved_user.updated_at.to_rfc3339(),
    };

    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    get,
    path = "/api/users/{user_id}",
    params(
        ("user_id" = String, Path, description = "User ID")
    ),
    responses(
        (status = 200, description = "User found successfully", body = UserResponse),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "User not found"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Users"
)]
pub async fn get_user(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();

    let user = Users::find_by_id(user_id)
        .filter(crate::entities::users::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    match user {
        Some(user) => {
            let response = UserResponse {
                id: user.id,
                username: user.username,
                email: user.email,
                status: user.status,
                created_at: user.created_at.to_rfc3339(),
                updated_at: user.updated_at.to_rfc3339(),
            };
            Ok(HttpResponse::Ok().json(response))
        }
        None => Err(ApiError::NotFound("用户不存在".to_string())),
    }
}

#[utoipa::path(
    put,
    path = "/api/users/{user_id}",
    params(
        ("user_id" = String, Path, description = "User ID")
    ),
    request_body = UserCreateRequest,
    responses(
        (status = 200, description = "User updated successfully", body = UserResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "User not found"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Users"
)]
pub async fn update_user(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    user: web::Json<UserCreateRequest>,
    req: web::HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(req.request())?;

    // 验证当前用户是否有更新用户的权限
    let permissions = get_user_permissions_by_type(&current_user_id.to_string(), "user_management", &db).await?;
    let has_permission = permissions.iter().any(|p| p.name == "user_management.update");
    if !has_permission {
        return Err(ApiError::Forbidden("没有权限更新用户".to_string()));
    }

    // 查找用户
    let existing_user = Users::find_by_id(&user_id)
        .filter(crate::entities::users::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_user = match existing_user {
        Some(user) => user,
        None => return Err(ApiError::NotFound("用户不存在".to_string())),
    };

    // 检查用户名是否被其他用户使用
    if existing_user.username != user.username {
        let username_exists = Users::find()
            .filter(crate::entities::users::Column::Username.eq(&user.username))
            .filter(crate::entities::users::Column::Id.ne(&user_id))
            .filter(crate::entities::users::Column::DeletedAt.is_null())
            .one(&**db)
            .await?;

        if username_exists.is_some() {
            return Err(ApiError::BadRequest("用户名已存在".to_string()));
        }
    }

    // 检查邮箱是否被其他用户使用
    if existing_user.email != user.email {
        let email_exists = Users::find()
            .filter(crate::entities::users::Column::Email.eq(&user.email))
            .filter(crate::entities::users::Column::Id.ne(&user_id))
            .filter(crate::entities::users::Column::DeletedAt.is_null())
            .one(&**db)
            .await?;

        if email_exists.is_some() {
            return Err(ApiError::BadRequest("邮箱已存在".to_string()));
        }
    }

    // 更新用户
    let password_hash = if !user.password.is_empty() {
        hash(&user.password, DEFAULT_COST)
            .map_err(|e| ApiError::InternalServerError(format!("密码加密失败: {}", e)))?
    } else {
        existing_user.password_hash.clone()
    };

    let updated_user = ActiveModel {
        id: Set(user_id),
        username: Set(user.username.clone()),
        email: Set(user.email.clone()),
        password_hash: Set(password_hash),
        status: Set(user.status.clone()),
        updated_by: Set(current_user_id.to_string()),
        revision: Set(existing_user.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    let saved_user = updated_user.update(&**db).await?;

    let response = UserResponse {
        id: saved_user.id,
        username: saved_user.username,
        email: saved_user.email,
        status: saved_user.status,
        created_at: saved_user.created_at.to_rfc3339(),
        updated_at: saved_user.updated_at.to_rfc3339(),
    };

    Ok(HttpResponse::Ok().json(response))
}

#[utoipa::path(
    delete,
    path = "/api/users/{user_id}",
    params(
        ("user_id" = String, Path, description = "User ID")
    ),
    responses(
        (status = 200, description = "User deleted successfully"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "User not found"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Users"
)]
pub async fn delete_user(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: web::HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(req.request())?;

    // 验证当前用户是否有删除用户的权限
    let permissions = get_user_permissions_by_type(&current_user_id.to_string(), "user_management", &db).await?;
    let has_permission = permissions.iter().any(|p| p.name == "user_management.delete");
    if !has_permission {
        return Err(ApiError::Forbidden("没有权限删除用户".to_string()));
    }

    // 查找用户
    let existing_user = Users::find_by_id(&user_id)
        .filter(crate::entities::users::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_user = match existing_user {
        Some(user) => user,
        None => return Err(ApiError::NotFound("用户不存在".to_string())),
    };

    // 软删除用户（设置 deleted_at 时间戳）
    let deleted_user = ActiveModel {
        id: Set(user_id),
        deleted_at: Set(Some(Utc::now().into())),
        updated_by: Set(current_user_id.to_string()),
        revision: Set(existing_user.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    deleted_user.update(&**db).await?;

    Ok(HttpResponse::Ok().json("用户删除成功"))
}

#[utoipa::path(
    post,
    path = "/api/users/{user_id}/disable",
    params(
        ("user_id" = String, Path, description = "User ID")
    ),
    responses(
        (status = 200, description = "User disabled successfully"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "User not found"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Users"
)]
pub async fn disable_user(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: web::HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(req.request())?;

    // 验证当前用户是否有禁用用户的权限
    let permissions = get_user_permissions_by_type(&current_user_id.to_string(), "user_management", &db).await?;
    let has_permission = permissions.iter().any(|p| p.name == "user_management.disable");
    if !has_permission {
        return Err(ApiError::Forbidden("没有权限禁用用户".to_string()));
    }

    // 查找用户
    let existing_user = Users::find_by_id(&user_id)
        .filter(crate::entities::users::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_user = match existing_user {
        Some(user) => user,
        None => return Err(ApiError::NotFound("用户不存在".to_string())),
    };

    // 禁用用户
    let disabled_user = ActiveModel {
        id: Set(user_id),
        status: Set("disabled".to_string()),
        updated_by: Set(current_user_id.to_string()),
        revision: Set(existing_user.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    disabled_user.update(&**db).await?;

    Ok(HttpResponse::Ok().json("用户禁用成功"))
}

#[utoipa::path(
    post,
    path = "/api/users/{user_id}/enable",
    params(
        ("user_id" = String, Path, description = "User ID")
    ),
    responses(
        (status = 200, description = "User enabled successfully"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "User not found"),
        (status = 500, description = "Internal server error")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Users"
)]
pub async fn enable_user(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: web::HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(req.request())?;

    // 验证当前用户是否有启用用户的权限
    let permissions = get_user_permissions_by_type(&current_user_id.to_string(), "user_management", &db).await?;
    let has_permission = permissions.iter().any(|p| p.name == "user_management.enable");
    if !has_permission {
        return Err(ApiError::Forbidden("没有权限启用用户".to_string()));
    }

    // 查找用户
    let existing_user = Users::find_by_id(&user_id)
        .filter(crate::entities::users::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_user = match existing_user {
        Some(user) => user,
        None => return Err(ApiError::NotFound("用户不存在".to_string())),
    };

    // 启用用户
    let enabled_user = ActiveModel {
        id: Set(user_id),
        status: Set("active".to_string()),
        updated_by: Set(current_user_id.to_string()),
        revision: Set(existing_user.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    enabled_user.update(&**db).await?;

    Ok(HttpResponse::Ok().json("用户启用成功"))
}
