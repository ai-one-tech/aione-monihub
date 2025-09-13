use crate::permissions::models::{
    MenuItemResponse, PermissionAssignRequest, PermissionListResponse, PermissionResponse,
    UserMenuResponse,
};
use crate::shared::error::ApiError;
use actix_web::{web, HttpResponse, Result};
use sea_orm::DatabaseConnection;
use uuid::Uuid;

pub async fn get_permissions() -> Result<HttpResponse, ApiError> {
    // TODO: Implement actual permission listing logic
    // This is a placeholder implementation

    let permissions = vec![PermissionResponse {
        id: "1".to_string(),
        name: "read_project".to_string(),
        description: Some("Read project information".to_string()),
        resource: "project".to_string(),
        action: "read".to_string(),
        permission_type: "action".to_string(),
        menu_path: None,
        menu_icon: None,
        parent_permission_id: None,
        sort_order: None,
        created_at: "2023-01-01T00:00:00Z".to_string(),
        updated_at: "2023-01-01T00:00:00Z".to_string(),
    }];

    let response = PermissionListResponse {
        data: permissions,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: Uuid::new_v4().to_string(),
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
pub async fn get_user_menu(_db: web::Data<DatabaseConnection>) -> Result<HttpResponse, ApiError> {
    // TODO: 在修复实体模型之后实现完整的菜单查询逻辑
    // 目前返回模拟数据
    let menu_items = vec![
        MenuItemResponse {
            id: Uuid::new_v4().to_string(),
            name: "menu.dashboard".to_string(),
            title: "Dashboard".to_string(),
            icon: Some("LayoutDashboard".to_string()),
            path: "/".to_string(),
            sort_order: 1,
            children: vec![],
        },
        MenuItemResponse {
            id: Uuid::new_v4().to_string(),
            name: "menu.tasks".to_string(),
            title: "Tasks".to_string(),
            icon: Some("ListTodo".to_string()),
            path: "/tasks".to_string(),
            sort_order: 2,
            children: vec![],
        },
        MenuItemResponse {
            id: Uuid::new_v4().to_string(),
            name: "menu.users".to_string(),
            title: "Users".to_string(),
            icon: Some("Users".to_string()),
            path: "/users".to_string(),
            sort_order: 3,
            children: vec![],
        },
        MenuItemResponse {
            id: Uuid::new_v4().to_string(),
            name: "menu.settings".to_string(),
            title: "Settings".to_string(),
            icon: Some("Settings".to_string()),
            path: "/settings".to_string(),
            sort_order: 4,
            children: vec![
                MenuItemResponse {
                    id: Uuid::new_v4().to_string(),
                    name: "menu.settings.account".to_string(),
                    title: "Account".to_string(),
                    icon: Some("Wrench".to_string()),
                    path: "/settings/account".to_string(),
                    sort_order: 1,
                    children: vec![],
                },
                MenuItemResponse {
                    id: Uuid::new_v4().to_string(),
                    name: "menu.settings.appearance".to_string(),
                    title: "Appearance".to_string(),
                    icon: Some("Palette".to_string()),
                    path: "/settings/appearance".to_string(),
                    sort_order: 2,
                    children: vec![],
                },
            ],
        },
    ];

    let response = UserMenuResponse {
        data: menu_items,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: Uuid::new_v4().to_string(),
    };

    Ok(HttpResponse::Ok().json(response))
}

// 暂时注释掉这些函数，等实体模型修复后再开启
/*
/// 构建菜单树结构
fn build_menu_tree(permissions: Vec<permissions::Model>) -> Vec<MenuItemResponse> {
    let mut menu_map: HashMap<Option<Uuid>, Vec<MenuItemResponse>> = HashMap::new();

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
        parent_id: Option<Uuid>,
        menu_map: &HashMap<Option<Uuid>, Vec<MenuItemResponse>>,
    ) -> Vec<MenuItemResponse> {
        if let Some(children) = menu_map.get(&parent_id) {
            children
                .iter()
                .map(|child| {
                    let child_id = Some(&child.id);
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
*/

pub async fn assign_permissions(
    _assign_req: web::Json<PermissionAssignRequest>,
) -> Result<HttpResponse, ApiError> {
    // TODO: Implement actual permission assignment logic
    // This is a placeholder implementation

    Ok(HttpResponse::Ok().json("Permissions assigned successfully"))
}

pub async fn revoke_permissions(
    _assign_req: web::Json<PermissionAssignRequest>,
) -> Result<HttpResponse, ApiError> {
    // TODO: Implement actual permission revocation logic
    // This is a placeholder implementation

    Ok(HttpResponse::Ok().json("Permissions revoked successfully"))
}
