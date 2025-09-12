pub mod models;
pub mod handlers;
pub mod routes;

use sea_orm::DatabaseConnection;
use crate::entities::{logs, Logs};

pub struct LogsModule {
    database: DatabaseConnection,
}

impl LogsModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_log(&self, log_data: logs::ActiveModel) -> Result<logs::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        log_data.insert(&self.database).await
    }

    pub async fn find_log_by_id(&self, id: i32) -> Result<Option<logs::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Logs::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_logs(&self) -> Result<Vec<logs::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Logs::find().all(&self.database).await
    }
}