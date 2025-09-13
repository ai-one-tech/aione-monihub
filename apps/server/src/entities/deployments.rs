use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "deployments")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    pub application_id: String,
    pub version: String,
    pub environment: String,
    pub status: String,
    pub config: Option<String>,
    pub deployed_at: Option<DateTimeWithTimeZone>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::applications::Entity",
        from = "Column::ApplicationId",
        to = "super::applications::Column::Id"
    )]
    Applications,
}

impl Related<super::applications::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Applications.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
