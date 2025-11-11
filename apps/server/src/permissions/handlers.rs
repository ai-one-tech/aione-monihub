use crate::auth::middleware::get_user_id_from_request;
use crate::entities::permissions::{Column, Entity as Permissions, Model as PermissionModel};
use crate::entities::roles::Entity as Roles;
use crate::entities::user_roles::Entity as UserRoles;
use crate::permissions::models::{
    MenuItemResponse, PermissionAssignRequest, PermissionCreateRequest, PermissionListResponse,
    PermissionResponse, PermissionUpdateRequest, UserMenuResponse,
};
use crate::shared::enums::PermissionType;
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, QuerySelect, Set,
};
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct PermissionQueryParams {
    pub page: Option<u64>,
    pub limit: Option<u64>,
    pub search: Option<String>,
    pub permission_type: Option<String>,
    pub action: Option<String>,
}

/// 获取权限列表
#[utoipa::path(
    get,
    path = "/api/permissions",
    tag = "Permissions",
    params(
        ("page" = Option<u64>, Query, description = "页码，从1开始"),
        ("limit" = Option<u64>, Query, description = "每页数量"),
        ("search" = Option<String>, Query, description = "搜索关键词"),
        ("permission_type" = Option<String>, Query, description = "权限类型筛选"),
        ("action" = Option<String>, Query, description = "操作筛选"),
    ),
    responses(
        (status = 200, description = "成功获取权限列表", body = PermissionListResponse),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn get_permissions(
    db: web::Data<DatabaseConnection>,
    query: web::Query<PermissionQueryParams>,
) -> Result<HttpResponse, ApiError> {
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(10).min(100);
    let offset = (page - 1) * limit;

    // 构建查询条件
    let mut query_builder = Permissions::find().filter(Column::DeletedAt.is_null());

    // 添加搜索条件
    if let Some(search) = &query.search {
        if !search.is_empty() {
            let search_pattern = format!("%{}%", search.trim());
            query_builder = query_builder.filter(
                Column::Name
                    .like(&search_pattern)
                    .or(Column::Description.like(&search_pattern)),
            );
        }
    }

    // 添加权限类型筛选 - 支持逗号分隔的多个类型
    if let Some(permission_type) = &query.permission_type {
        if !permission_type.is_empty() {
            // 检查是否包含逗号，如果有则拆分为多个类型
            if permission_type.contains(',') {
                let types: Vec<String> = permission_type
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect();
                
                if !types.is_empty() {
                    query_builder = query_builder.filter(Column::PermissionType.is_in(types));
                }
            } else {
                // 单个类型筛选
                query_builder = query_builder.filter(Column::PermissionType.eq(permission_type));
            }
        }
    }

    // 添加操作筛选 - 支持逗号分隔的多个操作
    if let Some(action) = &query.action {
        if !action.is_empty() {
            // 检查是否包含逗号，如果有则拆分为多个操作
            if action.contains(',') {
                let actions: Vec<String> = action
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect();
                
                if !actions.is_empty() {
                    query_builder = query_builder.filter(Column::PermissionAction.is_in(actions));
                }
            } else {
                // 单个操作筛选
                query_builder = query_builder.filter(Column::PermissionAction.eq(action));
            }
        }
    }

    // 获取总数
    let paginator = query_builder.clone().paginate(&**db, limit);
    let total = paginator.num_items().await?;
    let total_pages = paginator.num_pages().await?;

    // 获取分页数据
    let permissions: Vec<PermissionModel> = query_builder
        .order_by_asc(Column::Name)
        .offset(offset)
        .limit(limit)
        .all(&**db)
        .await?;

    // 转换为响应格式
    let permission_responses: Vec<PermissionResponse> = permissions
        .into_iter()
        .map(|permission| PermissionResponse {
            id: permission.id,
            name: permission.name,
            description: permission.description,
            action: permission.permission_action,
            permission_type: permission.permission_type,
            menu_path: permission.menu_path,
            menu_icon: permission.menu_icon,
            parent_permission_id: permission.parent_permission_id,
            sort_order: permission.sort_order,
            is_hidden: permission.is_hidden,
            created_at: permission.created_at.to_rfc3339(),
            updated_at: permission.updated_at.to_rfc3339(),
        })
        .collect();

    let response = PermissionListResponse {
        data: permission_responses,
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

/// 创建权限
#[utoipa::path(
    post,
    path = "/api/permissions",
    tag = "Permissions",
    request_body = PermissionCreateRequest,
    responses(
        (status = 200, description = "成功创建权限", body = PermissionResponse),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn create_permission(
    db: web::Data<DatabaseConnection>,
    permission: web::Json<PermissionCreateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    // 检查权限名是否已存在
    let existing_permission = Permissions::find()
        .filter(Column::Name.eq(&permission.name))
        .filter(Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if existing_permission.is_some() {
        return Err(ApiError::BadRequest("权限名已存在".to_string()));
    }

    // 获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 生成雪花ID
    let permission_id = generate_snowflake_id();

    // 创建权限
    let new_permission = crate::entities::permissions::ActiveModel {
        id: Set(permission_id.clone()),
        name: Set(permission.name.clone()),
        description: Set(permission.description.clone()),
        // 将字符串动作转换为枚举类型
        permission_action: Set(permission.action.clone()),
        permission_type: Set(permission.permission_type.clone()),
        menu_path: Set(permission.menu_path.clone()),
        menu_icon: Set(permission.menu_icon.clone()),
        parent_permission_id: Set(permission.parent_permission_id.clone()),
        sort_order: Set(permission.sort_order),
        is_hidden: Set(permission.is_hidden.unwrap_or(false)),
        created_by: Set(current_user_id.to_string()),
        updated_by: Set(current_user_id.to_string()),
        revision: Set(1),
        deleted_at: Set(None),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };

    let saved_permission = new_permission.insert(&**db).await?;

    let response = PermissionResponse {
        id: saved_permission.id,
        name: saved_permission.name,
        description: saved_permission.description,
        action: saved_permission.permission_action,
        permission_type: saved_permission.permission_type,
        menu_path: saved_permission.menu_path,
        menu_icon: saved_permission.menu_icon,
        parent_permission_id: saved_permission.parent_permission_id,
        sort_order: saved_permission.sort_order,
        is_hidden: saved_permission.is_hidden,
        created_at: saved_permission.created_at.to_rfc3339(),
        updated_at: saved_permission.updated_at.to_rfc3339(),
    };

    Ok(HttpResponse::Ok().json(response))
}

/// 获取权限详情
#[utoipa::path(
    get,
    path = "/api/permissions/{id}",
    tag = "Permissions",
    params(
        ("id" = String, Path, description = "权限ID")
    ),
    responses(
        (status = 200, description = "成功获取权限详情", body = PermissionResponse),
        (status = 404, description = "权限不存在"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn get_permission(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let permission_id = path.into_inner();

    let permission = Permissions::find_by_id(&permission_id)
        .filter(Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    match permission {
        Some(permission) => {
            let response = PermissionResponse {
                id: permission.id,
                name: permission.name,
                description: permission.description,
                action: permission.permission_action,
                permission_type: permission.permission_type,
                menu_path: permission.menu_path,
                menu_icon: permission.menu_icon,
                parent_permission_id: permission.parent_permission_id,
                sort_order: permission.sort_order,
                is_hidden: permission.is_hidden,
                created_at: permission.created_at.to_rfc3339(),
                updated_at: permission.updated_at.to_rfc3339(),
            };
            Ok(HttpResponse::Ok().json(response))
        }
        None => Err(ApiError::NotFound("权限不存在".to_string())),
    }
}

/// 更新权限
#[utoipa::path(
    put,
    path = "/api/permissions/{id}",
    tag = "Permissions",
    params(
        ("id" = String, Path, description = "权限ID")
    ),
    request_body = PermissionUpdateRequest,
    responses(
        (status = 200, description = "成功更新权限", body = PermissionResponse),
        (status = 400, description = "请求参数错误"),
        (status = 404, description = "权限不存在"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn update_permission(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    permission: web::Json<PermissionUpdateRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let permission_id = path.into_inner();

    // 检查权限是否存在
    let existing_permission = Permissions::find_by_id(&permission_id)
        .filter(Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_permission = match existing_permission {
        Some(permission) => permission,
        None => return Err(ApiError::NotFound("权限不存在".to_string())),
    };

    // 检查权限名是否已被其他权限使用
    let name_conflict = Permissions::find()
        .filter(Column::Name.eq(&permission.name))
        .filter(Column::Id.ne(&permission_id))
        .filter(Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    if name_conflict.is_some() {
        return Err(ApiError::BadRequest("权限名已存在".to_string()));
    }

    // 获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 保存revision值
    let current_revision = existing_permission.revision;

    // 更新权限
    let mut permission_active: crate::entities::permissions::ActiveModel =
        existing_permission.into();
    permission_active.name = Set(permission.name.clone());
    permission_active.description = Set(permission.description.clone());
    // 将字符串动作转换为枚举类型
    permission_active.permission_action = Set(permission.action.clone());
    permission_active.permission_type = Set(permission.permission_type.clone());
    permission_active.menu_path = Set(permission.menu_path.clone());
    permission_active.menu_icon = Set(permission.menu_icon.clone());
    permission_active.parent_permission_id = Set(permission.parent_permission_id.clone());
    permission_active.sort_order = Set(permission.sort_order);
    if let Some(is_hidden) = permission.is_hidden {
        permission_active.is_hidden = Set(is_hidden);
    }
    permission_active.updated_by = Set(current_user_id.to_string());
    permission_active.updated_at = Set(Utc::now().into());
    permission_active.revision = Set(current_revision + 1);

    let updated_permission = permission_active.update(&**db).await?;

    let response = PermissionResponse {
        id: updated_permission.id,
        name: updated_permission.name,
        description: updated_permission.description,
        action: updated_permission.permission_action,
        permission_type: updated_permission.permission_type,
        menu_path: updated_permission.menu_path,
        menu_icon: updated_permission.menu_icon,
        parent_permission_id: updated_permission.parent_permission_id,
        sort_order: updated_permission.sort_order,
        is_hidden: updated_permission.is_hidden,
        created_at: updated_permission.created_at.to_rfc3339(),
        updated_at: updated_permission.updated_at.to_rfc3339(),
    };

    Ok(HttpResponse::Ok().json(response))
}

/// 删除权限
#[utoipa::path(
    delete,
    path = "/api/permissions/{id}",
    tag = "Permissions",
    params(
        ("id" = String, Path, description = "权限ID")
    ),
    responses(
        (status = 200, description = "成功删除权限"),
        (status = 404, description = "权限不存在"),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn delete_permission(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let permission_id = path.into_inner();

    // 检查权限是否存在
    let existing_permission = Permissions::find_by_id(&permission_id)
        .filter(Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let existing_permission = match existing_permission {
        Some(permission) => permission,
        None => return Err(ApiError::NotFound("权限不存在".to_string())),
    };

    // 获取当前用户ID
    let current_user_id = get_user_id_from_request(&req)?;

    // 软删除权限
    let mut permission_active: crate::entities::permissions::ActiveModel =
        existing_permission.into();
    permission_active.deleted_at = Set(Some(Utc::now().into()));
    permission_active.updated_by = Set(current_user_id.to_string());
    permission_active.updated_at = Set(Utc::now().into());

    permission_active.update(&**db).await?;

    Ok(HttpResponse::Ok().json("权限删除成功"))
}

/// 获取当前用户的菜单权限
#[utoipa::path(
    get,
    path = "/api/user/menu",
    responses(
        (status = 200, description = "获取菜单成功", body = UserMenuResponse),
        (status = 401, description = "未授权"),
        (status = 500, description = "服务器内部错误")
    )
)]
pub async fn get_user_menu(
    req: HttpRequest,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    // 获取当前用户ID
    let user_id = get_user_id_from_request(&req)?;

    // 根据当前用户的角色获取权限菜单
    let menu_permissions: Vec<PermissionModel> = get_user_permissions_by_type(
        &user_id.to_string(),
        Vec::from([PermissionType::Menu, PermissionType::Page]),
        &**db,
    )
    .await?;

    // 构建菜单树
    let menu_items = build_menu_tree(menu_permissions);

    let response = UserMenuResponse {
        data: menu_items,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: generate_snowflake_id(),
    };

    Ok(HttpResponse::Ok().json(response))
}

/// 检查用户是否是管理员
pub async fn is_admin_user(user_id: &str, db: &DatabaseConnection) -> Result<bool, sea_orm::DbErr> {
    // 获取用户的所有角色
    let user_roles = UserRoles::find()
        .filter(crate::entities::user_roles::Column::UserId.eq(user_id))
        .find_with_related(Roles)
        .all(db)
        .await?;

    // 检查是否有admin角色
    for (_, roles) in user_roles {
        for role in roles {
            if role.name.to_lowercase() == "admin" {
                return Ok(true);
            }
        }
    }

    Ok(false)
}

pub async fn get_role_permissions_list_by_user(
    user_id: &str,
    role_id: &str,
    db: &DatabaseConnection,
) -> Result<Vec<PermissionModel>, sea_orm::DbErr> {
    // 检查用户是否是管理员
    let is_admin = is_admin_user(user_id, db).await?;

    if is_admin {
        let permissions = Permissions::find()
            .filter(Column::DeletedAt.is_null())
            .order_by_asc(Column::SortOrder)
            .order_by_asc(Column::Name)
            .all(db)
            .await?;
        Ok(permissions)
    } else {
        let permissions_ids: Vec<String> = RolePermissions::find()
            .filter(crate::entities::role_permissions::Column::RoleId.eq(role_id))
            .all(db)
            .await?
            .into_iter()
            .map(|p| p.id)
            .collect();

        let permissions = Permissions::find()
            .filter(Column::DeletedAt.is_null())
            .filter(Column::Id.is_in(permissions_ids))
            .order_by_asc(Column::SortOrder)
            .order_by_asc(Column::Name)
            .all(db)
            .await?;

        Ok(permissions)
    }
}

pub async fn get_role_permissions_list(
    role_id: &str,
    db: &DatabaseConnection,
) -> Result<Vec<PermissionModel>, sea_orm::DbErr> {
    // 检查用户是否是管理员
    let is_admin = is_admin_role(role_id, db).await?;

    if is_admin {
        let permissions = Permissions::find()
            .filter(Column::DeletedAt.is_null())
            .order_by_asc(Column::SortOrder)
            .order_by_asc(Column::Name)
            .all(db)
            .await?;
        Ok(permissions)
    } else {
        let permissions_ids: Vec<String> = RolePermissions::find()
            .filter(crate::entities::role_permissions::Column::RoleId.eq(role_id))
            .all(db)
            .await?
            .into_iter()
            .map(|p| p.permission_id)
            .collect();

        let permissions = Permissions::find()
            .filter(Column::DeletedAt.is_null())
            .filter(Column::Id.is_in(permissions_ids))
            .order_by_asc(Column::SortOrder)
            .order_by_asc(Column::Name)
            .all(db)
            .await?;

        Ok(permissions)
    }
}

/// 根据用户ID和权限类型获取用户权限
pub async fn get_user_permissions_by_type(
    user_id: &str,
    permission_types: Vec<PermissionType>,
    db: &DatabaseConnection,
) -> Result<Vec<PermissionModel>, sea_orm::DbErr> {
    // 检查用户是否是管理员
    let is_admin = is_admin_user(user_id, db).await?;

    // 直接使用枚举类型进行筛选与比较
    let permission_type_list: Vec<PermissionType> = permission_types.clone();

    // 如果是管理员，返回所有指定类型的权限
    let permissions = Permissions::find()
        .filter(Column::DeletedAt.is_null())
        .filter(Column::PermissionType.is_in(permission_type_list.clone()))
        .order_by_desc(Column::SortOrder)
        .all(db)
        .await?;

    if is_admin {
        // 管理员返回所有权限
        return Ok(permissions);
    }

    // 非管理员：从role_permissions表中获取用户拥有的权限
    let user_roles = UserRoles::find()
        .filter(crate::entities::user_roles::Column::UserId.eq(user_id))
        .find_with_related(Roles)
        .all(db)
        .await?;

    let role_ids: Vec<String> = user_roles
        .into_iter()
        .flat_map(|(_, roles)| roles.into_iter().map(|r| r.id))
        .collect();

    if role_ids.is_empty() {
        return Ok(vec![]);
    }

    // 从role_permissions表中查询权限
    let user_permissions: Vec<String> = crate::entities::role_permissions::Entity::find()
        .filter(crate::entities::role_permissions::Column::RoleId.is_in(&role_ids))
        .all(db)
        .await?
        .into_iter()
        .map(|p| p.permission_id)
        .collect();

    // 返回指定类型的权限
    let result = permissions
        .into_iter()
        .filter(|p| user_permissions.contains(&p.id))
        .filter(|p| {
            permission_type_list
                .clone()
                .contains(&p.permission_type)
        })
        .collect();

    Ok(result)
}

pub async fn get_user_permission_by_name(
    user_id: &str,
    name: &str,
    db: &DatabaseConnection,
) -> Result<Option<PermissionModel>, sea_orm::DbErr> {
    // 检查用户是否是管理员
    let is_admin = is_admin_user(user_id, db).await?;

    // 查找权限
    let permission = Permissions::find()
        .filter(Column::DeletedAt.is_null())
        .filter(Column::PermissionType.eq(PermissionType::Action))
        .filter(Column::Name.eq(name))
        .order_by_asc(Column::SortOrder)
        .order_by_asc(Column::Name)
        .one(db)
        .await?;

    // 如果是管理员，直接返回权限
    if is_admin {
        return Ok(permission);
    }

    // 如果不是管理员，需要检查用户是否拥有该权限
    if permission.is_none() {
        return Ok(None);
    }

    let permission = permission.unwrap();

    // 获取用户的角色
    let user_roles = UserRoles::find()
        .filter(crate::entities::user_roles::Column::UserId.eq(user_id))
        .find_with_related(Roles)
        .all(db)
        .await?;

    let role_ids: Vec<String> = user_roles
        .into_iter()
        .flat_map(|(_, roles)| roles.into_iter().map(|r| r.id))
        .collect();

    if role_ids.is_empty() {
        return Ok(None);
    }

    // 检查用户是否通过角色拥有该权限
    let has_permission = crate::entities::role_permissions::Entity::find()
        .filter(crate::entities::role_permissions::Column::RoleId.is_in(&role_ids))
        .filter(crate::entities::role_permissions::Column::PermissionId.eq(&permission.id))
        .one(db)
        .await?;

    if has_permission.is_some() {
        Ok(Some(permission))
    } else {
        Ok(None)
    }
}

// 更新权限分配功能
use crate::entities::role_permissions::{
    ActiveModel as RolePermissionActiveModel, Entity as RolePermissions,
};
use crate::roles::handlers::is_admin_role;

pub async fn assign_permissions(
    db: web::Data<DatabaseConnection>,
    assign_req: web::Json<PermissionAssignRequest>,
) -> Result<HttpResponse, ApiError> {
    // 检查角色是否存在
    let role = Roles::find_by_id(&assign_req.role_id)
        .filter(crate::entities::roles::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    let role = match role {
        Some(r) => r,
        None => return Err(ApiError::NotFound("角色不存在".to_string())),
    };

    // 禁止修改管理员角色的权限
    if role.name.to_lowercase() == "admin" {
        return Err(ApiError::Forbidden("不能修改管理员角色的权限".to_string()));
    }

    // 检查权限是否存在
    for permission_id in &assign_req.permissions {
        let permission_exists = Permissions::find_by_id(permission_id)
            .filter(Column::DeletedAt.is_null())
            .one(&**db)
            .await?;

        if permission_exists.is_none() {
            return Err(ApiError::NotFound(format!("权限 {} 不存在", permission_id)));
        }
    }

    // 先删除该角色的所有权限
    RolePermissions::delete_many()
        .filter(crate::entities::role_permissions::Column::RoleId.eq(&assign_req.role_id))
        .exec(&**db)
        .await?;

    // 添加新的权限关联
    for permission_id in &assign_req.permissions {
        let role_permission_id = generate_snowflake_id();

        let role_permission = RolePermissionActiveModel {
            id: Set(role_permission_id),
            role_id: Set(assign_req.role_id.clone()),
            permission_id: Set(permission_id.clone()),
            created_at: Set(Utc::now().into()),
        };

        role_permission.insert(&**db).await?;
    }

    Ok(HttpResponse::Ok().json("权限分配成功"))
}

pub async fn revoke_permissions(
    db: web::Data<DatabaseConnection>,
    assign_req: web::Json<PermissionAssignRequest>,
) -> Result<HttpResponse, ApiError> {
    // 删除指定的权限关联
    RolePermissions::delete_many()
        .filter(crate::entities::role_permissions::Column::RoleId.eq(&assign_req.role_id))
        .filter(
            crate::entities::role_permissions::Column::PermissionId.is_in(&assign_req.permissions),
        )
        .exec(&**db)
        .await?;

    Ok(HttpResponse::Ok().json("权限撤销成功"))
}

/// 构建菜单树结构
fn build_menu_tree(permissions: Vec<PermissionModel>) -> Vec<MenuItemResponse> {
    let mut menu_map: HashMap<Option<String>, Vec<MenuItemResponse>> = HashMap::new();

    // 先将所有权限转换为菜单项，过滤掉隐藏的菜单
    for permission in permissions {
        let menu_item = MenuItemResponse {
            id: permission.id.clone(),
            name: permission.name.clone(),
            title: extract_menu_title(permission.clone()),
            icon: permission.menu_icon.clone(),
            path: permission.menu_path.unwrap_or_default(),
            sort_order: permission.sort_order.unwrap_or(0),
            is_hidden: permission.is_hidden,
            children: vec![],
        };

        menu_map
            .entry(permission.parent_permission_id.clone())
            .or_insert_with(Vec::new)
            .push(menu_item);
    }

    // 递归构建菜单树
    fn build_children(
        parent_id: Option<String>,
        menu_map: &HashMap<Option<String>, Vec<MenuItemResponse>>,
    ) -> Vec<MenuItemResponse> {
        if let Some(children) = menu_map.get(&parent_id) {
            let mut result: Vec<MenuItemResponse> = children
                .iter()
                .map(|child| {
                    let child_id = Some(child.id.clone());
                    MenuItemResponse {
                        id: child.id.clone(),
                        name: child.name.clone(),
                        title: child.title.clone(),
                        icon: child.icon.clone(),
                        path: child.path.clone(),
                        sort_order: child.sort_order,
                        is_hidden: child.is_hidden,
                        children: build_children(child_id, menu_map),
                    }
                })
                .collect();

            // 按sort_order排序
            result.sort_by_key(|item| item.sort_order);
            result
        } else {
            vec![]
        }
    }

    // 获取根菜单项（parent_permission_id 为 None 的项目）
    let mut root_items = build_children(None, &menu_map);

    // 按sort_order排序
    root_items.sort_by_key(|item| item.sort_order);

    root_items
}

/// 从权限名称中提取菜单标题
fn extract_menu_title(permission: PermissionModel) -> String {
    return permission.description.unwrap_or_default();
    // let permission_name = permission.name.clone();
    // match permission_name {
    //     _ => permission_name
    //         .strip_prefix("menu.")
    //         .unwrap_or(&permission_name)
    //         .replace('.', " ")
    //         .split_whitespace()
    //         .map(|word| {
    //             let mut chars = word.chars();
    //             match chars.next() {
    //                 None => String::new(),
    //                 Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
    //             }
    //         })
    //         .collect::<Vec<_>>()
    //         .join(" "),
    // }
}
