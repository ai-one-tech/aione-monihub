pub mod models;
pub mod handlers;
pub mod routes;

use sea_orm::DatabaseConnection;
use crate::entities::{machines, Machines};

pub struct MachinesModule {
    database: DatabaseConnection,
}

impl MachinesModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_machine(&self, machine_data: machines::ActiveModel) -> Result<machines::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        machine_data.insert(&self.database).await
    }

    pub async fn find_machine_by_id(&self, id: i32) -> Result<Option<machines::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Machines::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_machines(&self) -> Result<Vec<machines::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Machines::find().all(&self.database).await
    }
}