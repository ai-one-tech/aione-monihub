pub mod models;
pub mod handlers;
pub mod routes;

use sea_orm::DatabaseConnection;
use crate::entities::{projects, Projects};

pub struct ProjectsModule {
    database: DatabaseConnection,
}

impl ProjectsModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_project(&self, project_data: projects::ActiveModel) -> Result<projects::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        project_data.insert(&self.database).await
    }

    pub async fn find_project_by_id(&self, id: i32) -> Result<Option<projects::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Projects::find_by_id(id).one(&self.database).await
    }

    pub async fn find_all_projects(&self) -> Result<Vec<projects::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Projects::find().all(&self.database).await
    }
}