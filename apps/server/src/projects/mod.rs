pub mod handlers;
pub mod models;
pub mod routes;

use crate::entities::{projects, Projects};
use crate::shared::generate_snowflake_id;
use sea_orm::{ActiveValue, DatabaseConnection};
use chrono::Utc;

pub struct ProjectsModule {
    database: DatabaseConnection,
}

impl ProjectsModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_project(
        &self,
        name: String,
        description: Option<String>,
        repository_url: Option<String>,
        owner_id: String,
    ) -> Result<projects::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        
        // 生成 Snowflake ID
        let id = generate_snowflake_id()
            .map_err(|e| sea_orm::DbErr::Custom(format!("Failed to generate ID: {}", e)))?;
        
        let now = Utc::now().into();
        
        let project_data = projects::ActiveModel {
            id: ActiveValue::Set(id),
            name: ActiveValue::Set(name),
            description: ActiveValue::Set(description),
            repository_url: ActiveValue::Set(repository_url),
            owner_id: ActiveValue::Set(owner_id),
            is_active: ActiveValue::Set(true),
            created_at: ActiveValue::Set(now),
            updated_at: ActiveValue::Set(now),
        };
        
        project_data.insert(&self.database).await
    }

    pub async fn find_project_by_id(
        &self,
        id: &str,
    ) -> Result<Option<projects::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Projects::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_projects(&self) -> Result<Vec<projects::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Projects::find().all(&self.database).await
    }
}
