use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "files")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    pub file_name: String,
    pub file_size: i64,
    pub file_path: String,
    pub uploaded_by: String,
    pub uploaded_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
    // 新增字段
    pub task_id: Option<String>,
    pub instance_id: Option<String>,
    pub file_extension: Option<String>,
    pub original_file_path: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}