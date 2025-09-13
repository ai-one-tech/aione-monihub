use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "configs")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,  // 改为String支持雪花ID
    pub code: String,
    pub environment: String,
    pub name: String,
    pub config_type: String,  // 修改字段名
    pub content: String,
    pub description: Option<String>,
    pub version: i32,
    pub created_by: String,  // 改为String支持雪花ID
    pub updated_by: String,  // 改为String支持雪花ID
    pub deleted_at: Option<DateTimeWithTimeZone>,  // 支持毫秒精度
    pub revision: i32,
    pub created_at: DateTimeWithTimeZone,  // 支持毫秒精度
    pub updated_at: DateTimeWithTimeZone,  // 支持毫秒精度
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}