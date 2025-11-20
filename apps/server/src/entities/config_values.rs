use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "config_values")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    pub config_id: String,
    pub config_code: String,
    pub environment: String,
    pub version: i32,
    pub value_code: String,
    pub value_name: String,
    pub value_data: Option<Json>,
    pub revision: i32,
    pub deleted_at: Option<DateTimeWithTimeZone>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}