pub mod handlers;
pub mod models;
pub mod routes;

use crate::entities::{permissions, Permissions};
use sea_orm::DatabaseConnection;

pub struct PermissionsModule {
    database: DatabaseConnection,
}

impl PermissionsModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_permission(
        &self,
        permission_data: permissions::ActiveModel,
    ) -> Result<permissions::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        permission_data.insert(&self.database).await
    }

    pub async fn find_permission_by_id(
        &self,
        id: String,
    ) -> Result<Option<permissions::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Permissions::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_permissions(&self) -> Result<Vec<permissions::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Permissions::find().all(&self.database).await
    }
}
