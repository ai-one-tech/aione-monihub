use crate::shared::enums;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "logs")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String, // 改为String支持雪花ID
    pub application_id: Option<String>, // 改为String支持雪花ID
    pub instance_id: Option<String>,    // 实例ID
    pub log_level: enums::LogLevel,     // 修改字段名
    pub message: String,
    pub context: Option<serde_json::Value>, // 使用JSON类型
    pub log_source: enums::LogSource,         // 修改字段名
    pub log_type: enums::LogType,             // 新增：日志类型
    pub timestamp: DateTimeWithTimeZone,    // 支持毫秒精度
    pub created_at: DateTimeWithTimeZone,   // 支持毫秒精度
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
