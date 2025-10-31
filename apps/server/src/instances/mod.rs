pub mod handlers;
pub mod models;
pub mod routes;

use crate::entities::{instances, Instances};
use sea_orm::DatabaseConnection;

pub struct InstancesModule {
    database: DatabaseConnection,
}

impl InstancesModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_instance(
        &self,
        instance_data: instances::ActiveModel,
    ) -> Result<instances::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        instance_data.insert(&self.database).await
    }

    pub async fn find_instance_by_id(
        &self,
        id: &str,
    ) -> Result<Option<instances::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Instances::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_instances(&self) -> Result<Vec<instances::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Instances::find().all(&self.database).await
    }
}
