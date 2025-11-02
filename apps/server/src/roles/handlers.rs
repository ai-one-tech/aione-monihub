use crate::auth::middleware::get_user_id_from_request;
use crate::entities::Permissions;
use crate::shared::error::ApiError;
use crate::shared::generate_snowflake_id;
use actix_web::{HttpRequest, HttpResponse, web};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter, QuerySelect, Set};
use crate::entities::role_permissions::{ActiveModel as RolePermissionActiveModel, Entity as RolePermissions};
use crate::entities::roles::{ActiveModel, Column, Entity as Roles};
use crate::roles::models::{RoleCreateRequest, RoleListResponse, RoleResponse, RolePermissionResponse, RolePermissionListResponse};

/// 获取角色列表
#[utoipa::path(
    get,
    path = "/api/roles",
    tag = "Roles",
    params(
        ("page" = Option<u32>, Query, description = "页码，默认为1"),
        ("page_size" = Option<u32>, Query, description = "每页数量，默认为10")
    ),
    responses(
        (status = 200, description = "成功获取角色列表", body = RoleListResponse),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn get_roles(
    db: web::Data<DatabaseConnection>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, ApiError> {
    let page = query.get("page").and_then(|p| p.parse().ok()).unwrap_or(1u64);
    let limit = query.get("limit").and_then(|p| p.parse().ok()).unwrap_or(10u64);
    let offset = (page - 1) * limit;

    // 构建查询
    let query_builder = Roles::find()
        .filter(Column::DeletedAt.is_null());

    // 获取总数
    let paginator = query_builder.clone().paginate(&**db, limit);
    let total = paginator.num_items().await?;
    let total_pages = paginator.num_pages().await?;

    // 获取分页数据
    let roles = query_builder
        .offset(offset)
        .limit(limit)
        .all(&**db)
        .await?;

    // 转换为响应格式
    let mut role_responses = Vec::new();
    for role in roles {
        // 获取角色权限
        let role_permissions = RolePermissions::find()
            .filter(crate::entities::role_permissions::Column::RoleId.eq(&role.id))
            .all(&**db)
            .await?;

        let mut permissions: Vec<String> = Vec::new();
        for role_permission in role_permissions {
            permissions.push(role_permission.permission_id);
        }

        let role_response = RoleResponse {
            id: role.id,
            name: role.name,
            description: role.description.unwrap_or_default(),
            permissions,
            created_at: role.created_at.to_rfc3339(),
            updated_at: role.updated_at.to_rfc3339(),
        };
        role_responses.push(role_response);
    }

    let response = RoleListResponse {
        data: role_responses,
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

/// 创建角色
#[utoipa::path(
    post,
    path = "/api/roles",
    tag = "Roles",
    request_body = RoleCreateRequest,
    responses(
        (status = 200, description = "成功创建角色", body = RoleResponse),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn create_role(
    db: web::Data<DatabaseConnection>,
    role: web::Json<RoleCreateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 检查角色名是否已存在
    let existing_role = Roles::find()
        .filter(crate::entities::roles::Column::Name.eq(&role.name))
        .filter(crate::entities::roles::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if existing_role.is_some() {
        return Err(ApiError::BadRequest("角色名已存在".to_string()));
    }

    // 获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 生成雪花ID
    let role_id = generate_snowflake_id();

    // 创建角色
    let new_role = ActiveModel {
        id: Set(role_id.clone()),
        name: Set(role.name.clone()),
        description: Set(Some(role.name.clone())),
        created_by: Set(current_user_id.to_string()),
        updated_by: Set(current_user_id.to_string()),
        revision: Set(1),
        deleted_at: Set(None),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };

    let saved_role = new_role.insert(&**db).await?;

    // 处理权限关联（在 role_permissions 表中插入记录）
    for permission_id in &role.permissions {
        // 检查权限是否存在
        let permission_exists = Permissions::find_by_id(permission_id)
            .filter(crate::entities::permissions::Column::DeletedAt.is_null())
            .one(&**db)
            .await?;

        if permission_exists.is_none() {
            return Err(ApiError::BadRequest(format!("权限 {} 不存在", permission_id)));
        }

        // 创建角色权限关联
        let role_permission_id = generate_snowflake_id();

        let role_permission = RolePermissionActiveModel {
            id: Set(role_permission_id),
            role_id: Set(role_id.clone()),
            permission_id: Set(permission_id.clone()),
            created_at: Set(Utc::now().into()),
        };

        role_permission.insert(&**db).await?;
    }

    let response = RoleResponse {
        id: saved_role.id,
        name: saved_role.name,
        description: saved_role.description.unwrap_or_default(),
        permissions: role.permissions.clone(),
        created_at: saved_role.created_at.to_rfc3339(),
        updated_at: saved_role.updated_at.to_rfc3339(),
    };

    Ok(HttpResponse::Ok().json(response))
}

/// 获取角色详情
#[utoipa::path(
    get,
    path = "/api/roles/{id}",
    tag = "Roles",
    params(
        ("id" = String, Path, description = "角色ID")
    ),
    responses(
        (status = 200, description = "成功获取角色详情", body = RoleResponse),
        (status = 404, description = "角色不存在"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn get_role(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let role_id = path.into_inner();

    let role = Roles::find_by_id(&role_id)
        .filter(crate::entities::roles::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    match role {
        Some(role) => {
            // 从 role_permissions 表中获取权限
            let role_permissions = RolePermissions::find()
                .filter(crate::entities::role_permissions::Column::RoleId.eq(&role.id))
                .all(&**db)
                .await?;

            let mut permissions: Vec<String> = Vec::new();
            for role_permission in role_permissions {
                permissions.push(role_permission.permission_id);
            }

            let response = RoleResponse {
                id: role.id,
                name: role.name,
                description: role.description.unwrap_or_default(),
                permissions,
                created_at: role.created_at.to_rfc3339(),
                updated_at: role.updated_at.to_rfc3339(),
            };
            Ok(HttpResponse::Ok().json(response))
        }
        None => Err(ApiError::NotFound("角色不存在".to_string())),
    }
}

/// 更新角色
#[utoipa::path(
    put,
    path = "/api/roles/{id}",
    tag = "Roles",
    params(
        ("id" = String, Path, description = "角色ID")
    ),
    request_body = RoleCreateRequest,
    responses(
        (status = 200, description = "成功更新角色", body = RoleResponse),
        (status = 400, description = "请求参数错误"),
        (status = 404, description = "角色不存在"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn update_role(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    role: web::Json<RoleCreateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let role_id = path.into_inner();

    // 查找角色
    let existing_role = Roles::find_by_id(&role_id)
        .filter(crate::entities::roles::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_role = match existing_role {
        Some(role) => role,
        None => return Err(ApiError::NotFound("角色不存在".to_string())),
    };

    // 检查角色名是否被其他角色使用
    if existing_role.name != role.name {
        let name_exists = Roles::find()
            .filter(crate::entities::roles::Column::Name.eq(&role.name))
            .filter(crate::entities::roles::Column::Id.ne(&role_id))
            .filter(crate::entities::roles::Column::DeletedAt.is_null())
            .one(&**db)
            .await?;

        if name_exists.is_some() {
            return Err(ApiError::BadRequest("角色名已存在".to_string()));
        }
    }

    // 获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 更新角色
    let updated_role = ActiveModel {
        id: Set(role_id),
        name: Set(role.name.clone()),
        description: Set(Some(role.description.clone())),
        updated_by: Set(current_user_id.to_string()),
        revision: Set(existing_role.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    let saved_role = updated_role.update(&**db).await?;

    // 更新权限关联（删除旧权限，插入新权限）
    // 首先删除旧权限
    RolePermissions::delete_many()
        .filter(crate::entities::role_permissions::Column::RoleId.eq(&saved_role.id))
        .exec(&**db)
        .await?;

    // 然后添加新权限
    for permission_id in &role.permissions {
        // 检查权限是否存在
        let permission_exists = Permissions::find_by_id(permission_id)
            .filter(crate::entities::permissions::Column::DeletedAt.is_null())
            .one(&**db)
            .await?;

        if permission_exists.is_none() {
            return Err(ApiError::BadRequest(format!("权限 {} 不存在", permission_id)));
        }

        // 创建角色权限关联
        let role_permission_id = generate_snowflake_id();

        let role_permission = RolePermissionActiveModel {
            id: Set(role_permission_id),
            role_id: Set(saved_role.id.clone()),
            permission_id: Set(permission_id.clone()),
            created_at: Set(Utc::now().into()),
        };

        role_permission.insert(&**db).await?;
    }

    let response = RoleResponse {
        id: saved_role.id,
        name: saved_role.name,
        description: saved_role.description.unwrap_or_default(),
        permissions: role.permissions.clone(),
        created_at: saved_role.created_at.to_rfc3339(),
        updated_at: saved_role.updated_at.to_rfc3339(),
    };

    Ok(HttpResponse::Ok().json(response))
}

/// 删除角色
#[utoipa::path(
    delete,
    path = "/api/roles/{id}",
    tag = "Roles",
    params(
        ("id" = String, Path, description = "角色ID")
    ),
    responses(
        (status = 200, description = "成功删除角色"),
        (status = 404, description = "角色不存在"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn delete_role(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let role_id = path.into_inner();

    // 查找角色
    let existing_role = Roles::find_by_id(&role_id)
        .filter(crate::entities::roles::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_role = match existing_role {
        Some(role) => role,
        None => return Err(ApiError::NotFound("角色不存在".to_string())),
    };

    // 获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 软删除角色（设置 deleted_at 时间戳）
    let deleted_role = ActiveModel {
        id: Set(role_id),
        deleted_at: Set(Some(Utc::now().into())),
        updated_by: Set(current_user_id.to_string()),
        revision: Set(existing_role.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    deleted_role.update(&**db).await?;

    Ok(HttpResponse::Ok().json("角色删除成功"))
}

/// 获取角色权限列表
#[utoipa::path(
    get,
    path = "/api/roles/{id}/permissions",
    tag = "Roles",
    params(
        ("id" = String, Path, description = "角色ID")
    ),
    responses(
        (status = 200, description = "成功获取角色权限列表", body = RolePermissionListResponse),
        (status = 404, description = "角色不存在"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn get_role_permissions(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let role_id = path.into_inner();

    // 检查角色是否存在
    let role_exists = Roles::find_by_id(&role_id)
        .filter(crate::entities::roles::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if role_exists.is_none() {
        return Err(ApiError::NotFound("角色不存在".to_string()));
    }

    // 获取角色权限关联
    let role_permissions = RolePermissions::find()
        .filter(crate::entities::role_permissions::Column::RoleId.eq(&role_id))
        .all(&**db)
        .await?;

    // 获取权限详情
    let mut permission_responses = Vec::new();
    for role_permission in role_permissions {
        let permission = Permissions::find_by_id(&role_permission.permission_id)
            .filter(crate::entities::permissions::Column::DeletedAt.is_null())
            .one(&**db)
            .await?;

        if let Some(permission) = permission {
            let permission_response = RolePermissionResponse {
                id: permission.id,
                name: permission.name,
                description: permission.description,
                resource: permission.permission_resource,
                action: permission.permission_action,
                permission_type: permission.permission_type,
                created_at: permission.created_at.to_rfc3339(),
            };
            permission_responses.push(permission_response);
        }
    }

    let response = RolePermissionListResponse {
        data: permission_responses,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: generate_snowflake_id(),
    };

    Ok(HttpResponse::Ok().json(response))
}