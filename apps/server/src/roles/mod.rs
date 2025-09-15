pub mod handlers;
pub mod models;
pub mod routes;

use crate::entities::{roles, Roles};
use crate::shared::generate_snowflake_id;
use sea_orm::{ActiveValue, DatabaseConnection};
use chrono::Utc;

pub struct RolesModule {
    database: DatabaseConnection,
}

impl RolesModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_role(
        &self,
        name: String,
        description: Option<String>,
        created_by: String,
    ) -> Result<roles::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        
        // 生成 Snowflake ID
        let id = generate_snowflake_id();
        
        let now = Utc::now().into();
        
        let role_data = roles::ActiveModel {
            id: ActiveValue::Set(id),
            name: ActiveValue::Set(name),
            description: ActiveValue::Set(description),
            created_by: ActiveValue::Set(created_by.clone()),
            updated_by: ActiveValue::Set(created_by),
            deleted_at: ActiveValue::Set(None),
            revision: ActiveValue::Set(1),
            created_at: ActiveValue::Set(now),
            updated_at: ActiveValue::Set(now),
        };
        
        role_data.insert(&self.database).await
    }

    pub async fn find_role_by_id(&self, id: &str) -> Result<Option<roles::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Roles::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_roles(&self) -> Result<Vec<roles::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Roles::find().all(&self.database).await
    }
}
