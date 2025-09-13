pub mod handlers;
pub mod models;
pub mod routes;

use crate::entities::{deployments, Deployments};
use sea_orm::DatabaseConnection;

pub struct DeploymentsModule {
    database: DatabaseConnection,
}

impl DeploymentsModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_deployment(
        &self,
        deployment_data: deployments::ActiveModel,
    ) -> Result<deployments::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        deployment_data.insert(&self.database).await
    }

    pub async fn find_deployment_by_id(
        &self,
        id: &str,
    ) -> Result<Option<deployments::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Deployments::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_deployments(&self) -> Result<Vec<deployments::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Deployments::find().all(&self.database).await
    }
}
