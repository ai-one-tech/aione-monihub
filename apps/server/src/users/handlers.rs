use crate::auth::middleware::get_user_id_from_request;
use crate::entities::users::Model as UserModel;
use crate::entities::users::{ActiveModel, Entity as Users};
use crate::permissions::handlers::get_user_permission_by_name;
use crate::shared::enums::UserStatus;

use crate::entities::roles::Entity as Roles;
use crate::entities::user_roles::{ActiveModel as UserRoleActiveModel, Entity as UserRoles};
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use crate::users::models::{
    RoleInfo, UserCreateRequest, UserListQuery, UserListResponse, UserResponse, UserRoleAssignRequest,
    UserRoleListResponse, UserRoleResponse, UserUpdateRequest,
};
use actix_web::{web, HttpRequest, HttpResponse, Result};
use bcrypt::{hash, DEFAULT_COST};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, QuerySelect, QueryTrait, Set,
};

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
        // 只有当search参数非空时才执行过滤
        if !search.trim().is_empty() {
            let search_pattern = format!("%{}%", search.trim());
            select = select.filter(
                crate::entities::users::Column::Username
                    .like(&search_pattern)
                    .or(crate::entities::users::Column::Email.like(&search_pattern)),
            );
        }
    }

    // 状态过滤
    if let Some(status) = &query.status {
        select = select.filter(crate::entities::users::Column::Status.eq(status.clone()));
    }

    // 角色过滤
    if let Some(roles) = &query.roles {
        let role_ids: Vec<String> = if roles.contains(',') {
            roles
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect()
        } else {
            Vec::from([roles.to_string()])
        };

        // 通过用户角色关联表进行过滤
        select = select.filter(
            crate::entities::users::Column::Id.in_subquery(
                crate::entities::user_roles::Entity::find()
                    .filter(crate::entities::user_roles::Column::RoleId.is_in(role_ids))
                    .select_only()
                    .column(crate::entities::user_roles::Column::UserId)
                    .as_query()
                    .clone() // 添加 .clone() 来解决类型不匹配问题
            )
        );
    }

    // 排序
    select = select.order_by_desc(crate::entities::users::Column::CreatedAt);

    // 获取总数和分页数据
    let paginator = select.clone().paginate(&**db, limit);
    let total = paginator.num_items().await?;
    let total_pages = paginator.num_pages().await?;

    let users: Vec<UserModel> = select
        .offset(offset)
        .limit(limit)
        .all(&**db)
        .await?;

    // 转换为响应格式，并查询每个用户的角色
    let mut user_responses: Vec<UserResponse> = Vec::new();
    for user in users {
        // 查询用户角色
        let user_roles = UserRoles::find()
            .filter(crate::entities::user_roles::Column::UserId.eq(&user.id))
            .find_with_related(Roles)
            .all(&**db)
            .await?;

        let role_infos: Vec<RoleInfo> = user_roles
            .into_iter()
            .filter_map(|(_, roles)| roles.into_iter().next())
            .map(|role| RoleInfo {
                id: role.id, // 添加缺失的 id 字段
                name: role.name,
                description: role.description,
            })
            .collect();

        user_responses.push(UserResponse {
            id: user.id,
            username: user.username,
            email: user.email,
            status: user.status,
            roles: role_infos,
            created_at: user.created_at.to_rfc3339(),
            updated_at: user.updated_at.to_rfc3339(),
        });
    }

    let response = UserListResponse {
        data: user_responses,
        total,
        page,
        page_size: limit,
        total_pages,
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
    req: HttpRequest,
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
    let user_id = generate_snowflake_id();

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 验证当前用户是否有创建用户的权限
    let permission = get_user_permission_by_name(&user_id.to_string(), "user_management.create", &db).await?;
    if permission.is_none() {
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
        roles: vec![], // 新创建的用户暂无角色
        created_at: saved_user.created_at.to_rfc3339(),
        updated_at: saved_user.updated_at.to_rfc3339(),
    };

    // 审计记录：新增用户
    let ci = req.connection_info();
    let ip_str = ci.realip_remote_addr().unwrap_or("").to_string();
    let trace_id = req.headers().get("x-trace-id").and_then(|v| v.to_str().ok());
    let after = serde_json::json!({
        "id": response.id,
        "username": response.username,
        "email": response.email,
        "status": response.status,
        "created_at": response.created_at,
        "updated_at": response.updated_at,
    });
    let _ = crate::audit::handlers::record_audit_log(
        &**db,
        "users",
        "create",
        &current_user_id.to_string(),
        &ip_str,
        trace_id,
        None,
        Some(after),
    ).await;

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
            // 查询用户角色
            let user_roles = UserRoles::find()
                .filter(crate::entities::user_roles::Column::UserId.eq(&user.id))
                .find_with_related(Roles)
                .all(&**db)
                .await?;

            let role_infos: Vec<RoleInfo> = user_roles
                .into_iter()
                .filter_map(|(_, roles)| roles.into_iter().next())
                .map(|role| RoleInfo {
                    id: role.id, // 添加缺失的 id 字段
                    name: role.name,
                    description: role.description,
                })
                .collect();

            let response = UserResponse {
                id: user.id,
                username: user.username,
                email: user.email,
                status: user.status,
                roles: role_infos,
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
    request_body = UserUpdateRequest,
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
    user: web::Json<UserUpdateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 验证当前用户是否有更新用户的权限
    let permission = get_user_permission_by_name(&user_id.to_string(), "user_management.update", &db).await?;
    if permission.is_none() {
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
    let updated_user = ActiveModel {
        id: Set(user_id),
        username: Set(user.username.clone()),
        email: Set(user.email.clone()),
        status: Set(user.status.clone()),
        updated_by: Set(current_user_id.to_string()),
        revision: Set(existing_user.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    let saved_user = updated_user.update(&**db).await?;

    // 如果请求中包含角色名称，则更新用户角色（通过角色名称匹配）
    if let Some(role_names) = &user.roles {
        // 删除现有角色关联
        UserRoles::delete_many()
            .filter(crate::entities::user_roles::Column::UserId.eq(&saved_user.id))
            .exec(&**db)
            .await?;

        // 根据角色名称查询角色ID并重新分配
        for role_name in role_names {
            // 查找角色
            let role = Roles::find()
                .filter(crate::entities::roles::Column::Name.eq(role_name))
                .filter(crate::entities::roles::Column::DeletedAt.is_null())
                .one(&**db)
                .await?;

            if let Some(role) = role {
                let user_role_id = generate_snowflake_id();
                let user_role = UserRoleActiveModel {
                    id: Set(user_role_id),
                    user_id: Set(saved_user.id.clone()),
                    role_id: Set(role.id.clone()),
                    created_by: Set(current_user_id.to_string()),
                    created_at: Set(Utc::now().into()),
                };
                user_role.insert(&**db).await?;
            }
        }
    }

    // 查询用户角色
    let user_roles = UserRoles::find()
        .filter(crate::entities::user_roles::Column::UserId.eq(&saved_user.id))
        .find_with_related(Roles)
        .all(&**db)
        .await?;

    let role_infos: Vec<RoleInfo> = user_roles
        .into_iter()
        .filter_map(|(_, roles)| roles.into_iter().next())
        .map(|role| RoleInfo {
            id: role.id, // 添加缺失的 id 字段
            name: role.name,
            description: role.description,
        })
        .collect();

    let response = UserResponse {
        id: saved_user.id,
        username: saved_user.username,
        email: saved_user.email,
        status: saved_user.status,
        roles: role_infos,
        created_at: saved_user.created_at.to_rfc3339(),
        updated_at: saved_user.updated_at.to_rfc3339(),
    };

    // 审计记录：更新用户
    let ci = req.connection_info();
    let ip_str = ci.realip_remote_addr().unwrap_or("").to_string();
    let trace_id = req.headers().get("x-trace-id").and_then(|v| v.to_str().ok());
    let before = serde_json::json!({
        "id": existing_user.id,
        "username": existing_user.username,
        "email": existing_user.email,
        "status": existing_user.status,
        "created_at": existing_user.created_at.to_rfc3339(),
        "updated_at": existing_user.updated_at.to_rfc3339(),
    });
    let after = serde_json::json!({
        "id": response.id,
        "username": response.username,
        "email": response.email,
        "status": response.status,
        "created_at": response.created_at,
        "updated_at": response.updated_at,
    });
    let _ = crate::audit::handlers::record_audit_log(
        &**db,
        "users",
        "update",
        &current_user_id.to_string(),
        &ip_str,
        trace_id,
        Some(before),
        Some(after),
    ).await;

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
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 验证当前用户是否有删除用户的权限
    let permission = get_user_permission_by_name(&user_id.to_string(), "user_management.delete", &db).await?;
    if permission.is_none() {
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

    // 审计记录：删除用户
    let ci = req.connection_info();
    let ip_str = ci.realip_remote_addr().unwrap_or("").to_string();
    let trace_id = req.headers().get("x-trace-id").and_then(|v| v.to_str().ok());
    let before = serde_json::json!({
        "id": existing_user.id,
        "username": existing_user.username,
        "email": existing_user.email,
        "status": existing_user.status,
        "created_at": existing_user.created_at.to_rfc3339(),
        "updated_at": existing_user.updated_at.to_rfc3339(),
    });
    let _ = crate::audit::handlers::record_audit_log(
        &**db,
        "users",
        "delete",
        &current_user_id.to_string(),
        &ip_str,
        trace_id,
        Some(before),
        None,
    ).await;

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
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 验证当前用户是否有禁用用户的权限
    let permission = get_user_permission_by_name(&user_id.to_string(), "user_management.disable", &db).await?;
    if permission.is_none() {
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
        status: Set(UserStatus::Disabled),
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
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();

    // 从JWT中获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 验证当前用户是否有启用用户的权限
    let permission = get_user_permission_by_name(&user_id.to_string(), "user_management.enable", &db).await?;
    if permission.is_none() {
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
        status: Set(UserStatus::Active),
        updated_by: Set(current_user_id.to_string()),
        revision: Set(existing_user.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    enabled_user.update(&**db).await?;

    Ok(HttpResponse::Ok().json("用户启用成功"))
}

/// 为用户分配角色
#[utoipa::path(
    post,
    path = "/api/users/{user_id}/roles",
    tag = "Users",
    params(
        ("user_id" = String, Path, description = "用户ID")
    ),
    request_body = UserRoleAssignRequest,
    responses(
        (status = 200, description = "成功分配角色"),
        (status = 400, description = "请求参数错误"),
        (status = 404, description = "用户不存在"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn assign_user_roles(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    roles: web::Json<UserRoleAssignRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();

    // 检查用户是否存在
    let user_exists = Users::find_by_id(&user_id)
        .filter(crate::entities::users::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if user_exists.is_none() {
        return Err(ApiError::NotFound("用户不存在".to_string()));
    }

    // 检查角色是否存在
    for role_id in &roles.role_ids {
        let role_exists = Roles::find_by_id(role_id)
            .filter(crate::entities::roles::Column::DeletedAt.is_null())
            .one(&**db)
            .await?;

        if role_exists.is_none() {
            return Err(ApiError::NotFound(format!("角色 {} 不存在", role_id)));
        }
    }

    // 获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 先删除该用户的所有角色
    UserRoles::delete_many()
        .filter(crate::entities::user_roles::Column::UserId.eq(&user_id))
        .exec(&**db)
        .await?;

    // 添加新的角色关联
    for role_id in &roles.role_ids {
        let user_role_id = generate_snowflake_id();

        let user_role = UserRoleActiveModel {
            id: Set(user_role_id),
            user_id: Set(user_id.clone()),
            role_id: Set(role_id.clone()),
            created_by: Set(current_user_id.to_string()),
            created_at: Set(Utc::now().into()),
        };

        user_role.insert(&**db).await?;
    }

    Ok(HttpResponse::Ok().json("角色分配成功"))
}

/// 移除用户角色
#[utoipa::path(
    delete,
    path = "/api/users/{user_id}/roles/{role_id}",
    tag = "Users",
    params(
        ("user_id" = String, Path, description = "用户ID"),
        ("role_id" = String, Path, description = "角色ID")
    ),
    responses(
        (status = 200, description = "成功移除角色"),
        (status = 404, description = "用户角色关联不存在"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn remove_user_role(
    db: web::Data<DatabaseConnection>,
    path: web::Path<(String, String)>,
) -> Result<HttpResponse, ApiError> {
    let (user_id, role_id) = path.into_inner();

    // 删除用户角色关联
    let delete_result = UserRoles::delete_many()
        .filter(crate::entities::user_roles::Column::UserId.eq(&user_id))
        .filter(crate::entities::user_roles::Column::RoleId.eq(&role_id))
        .exec(&**db)
        .await?;

    if delete_result.rows_affected == 0 {
        return Err(ApiError::NotFound("用户角色关联不存在".to_string()));
    }

    Ok(HttpResponse::Ok().json("角色移除成功"))
}

/// 获取用户角色列表
#[utoipa::path(
    get,
    path = "/api/users/{user_id}/roles",
    tag = "Users",
    params(
        ("user_id" = String, Path, description = "用户ID")
    ),
    responses(
        (status = 200, description = "成功获取用户角色列表", body = UserRoleListResponse),
        (status = 404, description = "用户不存在"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn get_user_roles(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();

    // 检查用户是否存在
    let user_exists = Users::find_by_id(&user_id)
        .filter(crate::entities::users::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if user_exists.is_none() {
        return Err(ApiError::NotFound("用户不存在".to_string()));
    }

    // 获取用户角色关联
    let user_roles = UserRoles::find()
        .filter(crate::entities::user_roles::Column::UserId.eq(&user_id))
        .all(&**db)
        .await?;

    // 获取角色详情
    let mut role_responses = Vec::new();
    for user_role in user_roles {
        let role = Roles::find_by_id(&user_role.role_id)
            .filter(crate::entities::roles::Column::DeletedAt.is_null())
            .one(&**db)
            .await?;

        if let Some(role) = role {
            let role_response = UserRoleResponse {
                id: user_role.id,
                user_id: user_role.user_id,
                role_id: user_role.role_id,
                role_name: role.name,
                created_at: user_role.created_at.to_rfc3339(),
            };
            role_responses.push(role_response);
        }
    }

    let response = UserRoleListResponse {
        data: role_responses,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: generate_snowflake_id(),
    };

    Ok(HttpResponse::Ok().json(response))
}
