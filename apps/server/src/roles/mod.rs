pub mod models;
pub mod handlers;
pub mod routes;

use sea_orm::DatabaseConnection;
use crate::entities::{roles, Roles};

pub struct RolesModule {
    database: DatabaseConnection,
}

impl RolesModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_role(&self, role_data: roles::ActiveModel) -> Result<roles::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        role_data.insert(&self.database).await
    }

    pub async fn find_role_by_id(&self, id: i32) -> Result<Option<roles::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Roles::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_roles(&self) -> Result<Vec<roles::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Roles::find().all(&self.database).await
    }
}