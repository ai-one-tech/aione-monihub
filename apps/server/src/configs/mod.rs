pub mod models;
pub mod handlers;
pub mod routes;

use sea_orm::DatabaseConnection;
use crate::entities::{configurations, Configurations};

pub struct ConfigsModule {
    database: DatabaseConnection,
}

impl ConfigsModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_config(&self, config_data: configurations::ActiveModel) -> Result<configurations::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        config_data.insert(&self.database).await
    }

    pub async fn find_config_by_id(&self, id: i32) -> Result<Option<configurations::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Configurations::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_configs(&self) -> Result<Vec<configurations::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Configurations::find().all(&self.database).await
    }
}