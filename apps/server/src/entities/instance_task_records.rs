use crate::shared::enums::TaskStatus;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "instance_task_records")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    pub task_id: String,
    pub instance_id: String,
    pub status: TaskStatus,
    pub dispatch_time: Option<DateTimeWithTimeZone>,
    pub start_time: Option<DateTimeWithTimeZone>,
    pub end_time: Option<DateTimeWithTimeZone>,
    pub duration_ms: Option<i64>,
    pub result_code: Option<i32>,
    pub result_message: Option<String>,
    pub result_data: Option<Json>,
    pub error_message: Option<String>,
    pub retry_attempt: Option<i32>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::instance_tasks::Entity",
        from = "Column::TaskId",
        to = "super::instance_tasks::Column::Id"
    )]
    Task,
    #[sea_orm(
        belongs_to = "super::instances::Entity",
        from = "Column::InstanceId",
        to = "super::instances::Column::Id"
    )]
    Instance,
}

impl Related<super::instance_tasks::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Task.def()
    }
}

impl Related<super::instances::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Instance.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
