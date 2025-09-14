use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "applications")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,  // 改为String支持雪花ID
    pub project_id: String,  // 改为String支持雪花ID
    pub name: String,
    pub code: String,
    pub status: String,
    pub description: Option<String>,
    pub auth_config: serde_json::Value,  // 修改字段名，使用JSON类型
    pub created_by: String,  // 改为String支持雪花ID
    pub updated_by: String,  // 改为String支持雪花ID
    pub deleted_at: Option<DateTimeWithTimeZone>,  // 支持毫秒精度
    pub revision: i32,
    pub created_at: DateTimeWithTimeZone,  // 支持毫秒精度
    pub updated_at: DateTimeWithTimeZone,  // 支持毫秒精度
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::projects::Entity",
        from = "Column::ProjectId",
        to = "super::projects::Column::Id"
    )]
    Projects,
    #[sea_orm(has_many = "super::deployments::Entity")]
    Deployments,
}

impl Related<super::projects::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Projects.def()
    }
}

impl Related<super::deployments::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Deployments.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApplicationDetail {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub code: String,
    pub status: String,
    pub description: Option<String>,
    pub auth_config: serde_json::Value,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTimeWithTimeZone>,
    pub revision: i32,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
    // 添加与部署的关联信息
    pub deployments: Option<Vec<super::deployments::Model>>,
}
