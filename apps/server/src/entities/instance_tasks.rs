use sea_orm::entity::prelude::*;
use crate::shared::enums::TaskType;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "instance_tasks")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    pub task_name: String,
    pub task_type: TaskType,
    pub target_instances: Json,
    pub task_content: Json,
    pub priority: Option<i32>,
    pub timeout_seconds: Option<i32>,
    pub retry_count: Option<i32>,
    pub application_id: Option<String>,
    pub created_by: String,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
    pub deleted_at: Option<DateTimeWithTimeZone>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::instance_task_records::Entity")]
    TaskRecords,
}

impl Related<super::instance_task_records::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::TaskRecords.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
