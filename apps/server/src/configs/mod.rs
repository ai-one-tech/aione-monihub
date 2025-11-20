pub mod handlers;
pub mod models;
pub mod routes;
pub mod value_sync;

use crate::entities::{configs, Configs};
use sea_orm::DatabaseConnection;

pub struct ConfigsModule {
    database: DatabaseConnection,
}

impl ConfigsModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_config(
        &self,
        config_data: configs::ActiveModel,
    ) -> Result<configs::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        config_data.insert(&self.database).await
    }

    pub async fn find_config_by_id(
        &self,
        id: &str,
    ) -> Result<Option<configs::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Configs::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_configs(&self) -> Result<Vec<configs::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Configs::find().all(&self.database).await
    }
}
