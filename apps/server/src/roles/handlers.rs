use crate::entities::roles::{ActiveModel, Entity as Roles, Model as RoleModel};
use crate::roles::models::{RoleCreateRequest, RoleListResponse, RoleResponse};
use crate::shared::error::ApiError;
use crate::shared::snowflake::generate_snowflake_id;
use actix_web::{web, HttpResponse, Result};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;

pub async fn get_roles(db: web::Data<DatabaseConnection>) -> Result<HttpResponse, ApiError> {
    // 获取所有未删除的角色
    let roles: Vec<RoleModel> = Roles::find()
        .filter(crate::entities::roles::Column::DeletedAt.is_null())
        .order_by_desc(crate::entities::roles::Column::CreatedAt)
        .all(&**db)
        .await?;

    // 转换为响应格式
    let role_responses: Vec<RoleResponse> = roles
        .into_iter()
        .map(|role| RoleResponse {
            id: role.id,
            name: role.name,
            description: role.description.unwrap_or_default(),
            permissions: vec![], // TODO: 从 role_permissions 表中获取权限
            created_at: role.created_at.to_rfc3339(),
            updated_at: role.updated_at.to_rfc3339(),
        })
        .collect();

    let response = RoleListResponse {
        data: role_responses,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        trace_id: Uuid::new_v4().to_string(),
    };

    Ok(HttpResponse::Ok().json(response))
}

pub async fn create_role(
    db: web::Data<DatabaseConnection>,
    role: web::Json<RoleCreateRequest>,
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

    // 生成雪花ID
    let role_id = generate_snowflake_id().map_err(|e| ApiError::InternalServerError(e))?;

    // 创建角色
    let new_role = ActiveModel {
        id: Set(role_id.clone()),
        name: Set(role.name.clone()),
        description: Set(Some(role.description.clone())),
        created_by: Set("system".to_string()), // TODO: 从JWT中获取当前用户ID
        updated_by: Set("system".to_string()),
        revision: Set(1),
        deleted_at: Set(None),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };

    let saved_role = new_role.insert(&**db).await?;

    // TODO: 处理权限关联（在 role_permissions 表中插入记录）

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

pub async fn get_role(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let role_id = path.into_inner();

    let role = Roles::find_by_id(role_id)
        .filter(crate::entities::roles::Column::DeletedAt.is_null())
        .one(&**db)
        .await?;

    match role {
        Some(role) => {
            let response = RoleResponse {
                id: role.id,
                name: role.name,
                description: role.description.unwrap_or_default(),
                permissions: vec![], // TODO: 从 role_permissions 表中获取权限
                created_at: role.created_at.to_rfc3339(),
                updated_at: role.updated_at.to_rfc3339(),
            };
            Ok(HttpResponse::Ok().json(response))
        }
        None => Err(ApiError::NotFound("角色不存在".to_string())),
    }
}

pub async fn update_role(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
    role: web::Json<RoleCreateRequest>,
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

    // 更新角色
    let updated_role = ActiveModel {
        id: Set(role_id),
        name: Set(role.name.clone()),
        description: Set(Some(role.description.clone())),
        updated_by: Set("system".to_string()), // TODO: 从JWT中获取当前用户ID
        revision: Set(existing_role.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    let saved_role = updated_role.update(&**db).await?;

    // TODO: 更新权限关联（删除旧权限，插入新权限）

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

pub async fn delete_role(
    db: web::Data<DatabaseConnection>,
    path: web::Path<String>,
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

    // 软删除角色（设置 deleted_at 时间戳）
    let deleted_role = ActiveModel {
        id: Set(role_id),
        deleted_at: Set(Some(Utc::now().into())),
        updated_by: Set("system".to_string()), // TODO: 从JWT中获取当前用户ID
        revision: Set(existing_role.revision + 1),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    deleted_role.update(&**db).await?;

    Ok(HttpResponse::Ok().json("角色删除成功"))
}
