pub mod handlers;
pub mod models;
pub mod routes;

use crate::entities::{projects, Projects};
use crate::shared::enums::Status;
use crate::shared::generate_snowflake_id;
use chrono::Utc;
use sea_orm::{ActiveValue, DatabaseConnection};

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
        code: String,
        status: String,
        description: Option<String>,
        created_by: String,
    ) -> Result<projects::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;

        // 生成 Snowflake ID
        let id = generate_snowflake_id();

        let now = Utc::now().into();

        let project_data = projects::ActiveModel {
            id: ActiveValue::Set(id),
            name: ActiveValue::Set(name),
            code: ActiveValue::Set(code),
            // 将字符串状态转换为枚举
            status: ActiveValue::Set(match status.to_lowercase().as_str() {
                "active" => Status::Active,
                "disabled" => Status::Disabled,
                _ => Status::Active,
            }),
            description: ActiveValue::Set(description),
            created_by: ActiveValue::Set(created_by.clone()),
            updated_by: ActiveValue::Set(created_by),
            deleted_at: ActiveValue::Set(None),
            revision: ActiveValue::Set(1),
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
