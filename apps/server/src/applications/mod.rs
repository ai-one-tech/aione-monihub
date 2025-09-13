pub mod handlers;
pub mod models;
pub mod routes;

use crate::entities::{applications, Applications};
use sea_orm::DatabaseConnection;

pub struct ApplicationsModule {
    database: DatabaseConnection,
}

impl ApplicationsModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_application(
        &self,
        app_data: applications::ActiveModel,
    ) -> Result<applications::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        app_data.insert(&self.database).await
    }

    pub async fn find_application_by_id(
        &self,
        id: &str,
    ) -> Result<Option<applications::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Applications::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_applications(&self) -> Result<Vec<applications::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Applications::find().all(&self.database).await
    }
}
