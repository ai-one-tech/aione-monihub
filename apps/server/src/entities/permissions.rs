
use crate::shared::enums::{PermissionAction, PermissionType};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "permissions")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String, // 改为String支持雪花ID
    #[sea_orm(unique)]
    pub name: String,
    pub description: Option<String>,
    pub permission_action: Option<PermissionAction>, // 修改字段名
    pub permission_type: PermissionType,
    pub menu_path: Option<String>,
    pub menu_icon: Option<String>,
    pub parent_permission_id: Option<String>, // 改为String支持雪花ID
    pub sort_order: Option<i32>,
    pub is_hidden: bool,                          // 是否隐藏菜单
    pub created_by: String,                       // 改为String支持雪花ID
    pub updated_by: String,                       // 改为String支持雪花ID
    pub deleted_at: Option<DateTimeWithTimeZone>, // 支持毫秒精度
    pub revision: i32,
    pub created_at: DateTimeWithTimeZone, // 支持毫秒精度
    pub updated_at: DateTimeWithTimeZone, // 支持毫秒精度
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::role_permissions::Entity")]
    RolePermissions,
}

impl Related<super::role_permissions::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RolePermissions.def()
    }
}

impl Related<super::roles::Entity> for Entity {
    fn to() -> RelationDef {
        super::role_permissions::Relation::Roles.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::role_permissions::Relation::Permissions.def().rev())
    }
}

impl ActiveModelBehavior for ActiveModel {}
