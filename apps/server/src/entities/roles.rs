use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "roles")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    #[sea_orm(unique)]
    pub name: String,
    pub description: Option<String>,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTimeWithTimeZone>,
    pub revision: i32,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::role_permissions::Entity")]
    RolePermissions,
    #[sea_orm(has_many = "super::user_roles::Entity")]
    UserRoles,
}

impl Related<super::role_permissions::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RolePermissions.def()
    }
}

impl Related<super::user_roles::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::UserRoles.def()
    }
}

impl Related<super::permissions::Entity> for Entity {
    fn to() -> RelationDef {
        super::role_permissions::Relation::Permissions.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::role_permissions::Relation::Roles.def().rev())
    }
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        super::user_roles::Relation::Users.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::user_roles::Relation::Roles.def().rev())
    }
}

impl ActiveModelBehavior for ActiveModel {}
