use crate::entities::permissions::{Entity as Permissions, Model as PermissionModel};
use crate::entities::{Roles};
use crate::permissions::models::{
    MenuItemResponse, PermissionAssignRequest, PermissionListResponse, PermissionResponse,
    UserMenuResponse,
};
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use crate::auth::middleware::get_user_id_from_request;
use actix_web::{web, HttpResponse, Result, HttpRequest};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
use std::collections::HashMap;

pub async fn get_permissions(
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, ApiError> {
    // 获取所有未删除的权限
    let permissions: Vec<PermissionModel> = Permissions::find()
        .filter(crate::entities::permissions::Column::DeletedAt.is_null())
        .order_by_asc(crate::entities::permissions::Column::SortOrder)
        .order_by_asc(crate::entities::permissions::Column::Name)
        .all(&**db)
        .await?;

    // 转换为响应格式
    let permission_responses: Vec<PermissionResponse> = permissions
        .into_iter()
        .map(|permission| PermissionResponse {
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.permission_resource,
            action: permission.permission_action,
            permission_type: permission.permission_type,
            menu_path: permission.menu_path,
            menu_icon: permission.menu_icon,
            parent_permission_id: permission.parent_permission_id,
            sort_order: permission.sort_order,
            created_at: permission.created_at.to_rfc3339(),
            updated_at: permission.updated_at.to_rfc3339(),
        })
        .collect();

    let response = PermissionListResponse {
        data: permission_responses,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: generate_snowflake_id(),
    };

    Ok(HttpResponse::Ok().json(response))
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
    let menu_permissions: Vec<PermissionModel> = get_user_permissions_by_type(&user_id.to_string(), "menu", &**db).await?;

    // 如果没有菜单数据，返回默认菜单
    if menu_permissions.is_empty() {
        let default_menu_items = get_default_menu();
        let response = UserMenuResponse {
            data: default_menu_items,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            trace_id: generate_snowflake_id(),
        };
        return Ok(HttpResponse::Ok().json(response));
    }

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

/// 根据用户ID和权限类型获取用户权限
pub async fn get_user_permissions_by_type(
    _user_id: &str,
    permission_type: &str,
    db: &DatabaseConnection,
) -> Result<Vec<PermissionModel>, sea_orm::DbErr> {
    // 简化的实现：暂时返回所有指定类型的权限
    let permissions = Permissions::find()
        .filter(crate::entities::permissions::Column::DeletedAt.is_null())
        .filter(crate::entities::permissions::Column::PermissionType.eq(permission_type))
        .order_by_asc(crate::entities::permissions::Column::SortOrder)
        .order_by_asc(crate::entities::permissions::Column::Name)
        .all(db)
        .await?;

    Ok(permissions)
}

// 暂时注释掉这些函数，等实体模型修复后再开启
/*
/// 构建菜单树结构
fn build_menu_tree(permissions: Vec<permissions::Model>) -> Vec<MenuItemResponse> {
    let mut menu_map: HashMap<Option<String>, Vec<MenuItemResponse>> = HashMap::new();

    // 先将所有权限转换为菜单项
    for permission in permissions {
        let menu_item = MenuItemResponse {
            id: permission.id.to_string(),
            name: permission.name.clone(),
            title: extract_menu_title(&permission.name),
            icon: permission.menu_icon,
            path: permission.menu_path.unwrap_or_default(),
            sort_order: permission.sort_order.unwrap_or(0),
            children: vec![],
        };

        menu_map
            .entry(permission.parent_permission_id)
            .or_insert_with(Vec::new)
            .push(menu_item);
    }

    // 递归构建菜单树
    fn build_children(
        parent_id: Option<String>,
        menu_map: &HashMap<Option<String>, Vec<MenuItemResponse>>,
    ) -> Vec<MenuItemResponse> {
        if let Some(children) = menu_map.get(&parent_id) {
            children
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
                        children: build_children(child_id, menu_map),
                    }
                })
                .collect()
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
fn extract_menu_title(permission_name: &str) -> String {
    match permission_name {
        // 新的中文菜单项
        "menu.dashboard" => "仪表板".to_string(),
        "menu.projects" => "项目".to_string(),
        "menu.applications" => "应用".to_string(),
        "menu.machines" => "机器".to_string(),
        "menu.deployments" => "部署".to_string(),
        "menu.logs" => "日志".to_string(),
        "menu.logs.system" => "系统日志".to_string(),
        "menu.logs.operations" => "操作日志".to_string(),
        "menu.logs.requests" => "请求日志".to_string(),
        "menu.system" => "系统".to_string(),
        "menu.system.users" => "用户".to_string(),
        "menu.system.roles" => "角色".to_string(),
        "menu.system.permissions" => "权限".to_string(),
        
        // 保留原有的英文菜单项（用于兼容）
        "menu.tasks" => "Tasks".to_string(),
        "menu.apps" => "Apps".to_string(),
        "menu.chats" => "Chats".to_string(),
        "menu.users" => "Users".to_string(),
        "menu.settings" => "Settings".to_string(),
        "menu.help-center" => "Help Center".to_string(),
        "menu.settings.account" => "Account".to_string(),
        "menu.settings.appearance" => "Appearance".to_string(),
        "menu.settings.notifications" => "Notifications".to_string(),
        "menu.settings.display" => "Display".to_string(),
        
        _ => permission_name
            .strip_prefix("menu.")
            .unwrap_or(permission_name)
            .replace('.', " ")
            .split_whitespace()
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            })
            .collect::<Vec<_>>()
            .join(" "),
    }
}
*/

// 更新权限分配功能
use crate::entities::role_permissions::{ActiveModel as RolePermissionActiveModel, Entity as RolePermissions};
use sea_orm::{ActiveModelTrait, Set};
use chrono::Utc;

pub async fn assign_permissions(
    db: web::Data<DatabaseConnection>,
    assign_req: web::Json<PermissionAssignRequest>,
) -> Result<HttpResponse, ApiError> {
    // 检查角色是否存在
    let role_exists = Roles::find_by_id(&assign_req.role_id)
        .filter(crate::entities::roles::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;
    
    if role_exists.is_none() {
        return Err(ApiError::NotFound("角色不存在".to_string()));
    }
    
    // 检查权限是否存在
    for permission_id in &assign_req.permissions {
        let permission_exists = Permissions::find_by_id(permission_id)
            .filter(crate::entities::permissions::Column::DeletedAt.is_null())
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
        .filter(crate::entities::role_permissions::Column::PermissionId.is_in(&assign_req.permissions))
        .exec(&**db)
        .await?;

    Ok(HttpResponse::Ok().json("权限撤销成功"))
}

/// 获取默认菜单
fn get_default_menu() -> Vec<MenuItemResponse> {
    vec![
        MenuItemResponse {
                    id: generate_snowflake_id(),
            name: "menu.dashboard".to_string(),
            title: "Dashboard".to_string(),
            icon: Some("LayoutDashboard".to_string()),
            path: "/".to_string(),
            sort_order: 1,
            children: vec![],
        },
        MenuItemResponse {
                    id: generate_snowflake_id(),
            name: "menu.tasks".to_string(),
            title: "Tasks".to_string(),
            icon: Some("ListTodo".to_string()),
            path: "/tasks".to_string(),
            sort_order: 2,
            children: vec![],
        },
        MenuItemResponse {
                    id: generate_snowflake_id(),
            name: "menu.users".to_string(),
            title: "Users".to_string(),
            icon: Some("Users".to_string()),
            path: "/users".to_string(),
            sort_order: 3,
            children: vec![],
        },
        MenuItemResponse {
            id: generate_snowflake_id(),
            name: "menu.settings".to_string(),
            title: "Settings".to_string(),
            icon: Some("Settings".to_string()),
            path: "/settings".to_string(),
            sort_order: 4,
            children: vec![
                MenuItemResponse {
                    id: generate_snowflake_id(),
                    name: "menu.settings.account".to_string(),
                    title: "Account".to_string(),
                    icon: Some("Wrench".to_string()),
                    path: "/settings/account".to_string(),
                    sort_order: 1,
                    children: vec![],
                },
                MenuItemResponse {
                    id: generate_snowflake_id(),
                    name: "menu.settings.appearance".to_string(),
                    title: "Appearance".to_string(),
                    icon: Some("Palette".to_string()),
                    path: "/settings/appearance".to_string(),
                    sort_order: 2,
                    children: vec![],
                },
            ],
        },
    ]
}

/// 构建菜单树结构
fn build_menu_tree(permissions: Vec<PermissionModel>) -> Vec<MenuItemResponse> {
    let mut menu_map: HashMap<Option<String>, Vec<MenuItemResponse>> = HashMap::new();

    // 先将所有权限转换为菜单项
    for permission in permissions {
        let menu_item = MenuItemResponse {
            id: permission.id.clone(),
            name: permission.name.clone(),
            title: extract_menu_title(&permission.name),
            icon: permission.menu_icon.clone(),
            path: permission.menu_path.unwrap_or_default(),
            sort_order: permission.sort_order.unwrap_or(0),
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
fn extract_menu_title(permission_name: &str) -> String {
    match permission_name {
        "menu.dashboard" => "Dashboard".to_string(),
        "menu.tasks" => "Tasks".to_string(),
        "menu.apps" => "Apps".to_string(),
        "menu.chats" => "Chats".to_string(),
        "menu.users" => "Users".to_string(),
        "menu.settings" => "Settings".to_string(),
        "menu.help-center" => "Help Center".to_string(),
        "menu.settings.account" => "Account".to_string(),
        "menu.settings.appearance" => "Appearance".to_string(),
        "menu.settings.notifications" => "Notifications".to_string(),
        "menu.settings.display" => "Display".to_string(),
        _ => permission_name
            .strip_prefix("menu.")
            .unwrap_or(permission_name)
            .replace('.', " ")
            .split_whitespace()
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            })
            .collect::<Vec<_>>()
            .join(" "),
    }
}
