pub mod models;
pub mod handlers;
pub mod routes;

use sea_orm::DatabaseConnection;
use crate::entities::{users, Users};

pub struct UsersModule {
    database: DatabaseConnection,
}

impl UsersModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_user(&self, user_data: users::ActiveModel) -> Result<users::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        user_data.insert(&self.database).await
    }

    pub async fn find_user_by_id(&self, id: i32) -> Result<Option<users::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Users::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_users(&self) -> Result<Vec<users::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Users::find().all(&self.database).await
    }
}