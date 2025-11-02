pub mod handlers;
pub mod models;
pub mod routes;

use crate::entities::applications::{Entity as Applications};
use crate::entities::applications;
use sea_orm::{ColumnTrait, DatabaseConnection, QueryFilter};

pub struct ApplicationsModule {
    database: DatabaseConnection,
}

impl ApplicationsModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_application(
        &self,
        app_data: applications::ActiveModel,
    ) -> Result<applications::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        app_data.insert(&self.database).await
    }

    pub async fn find_application_by_id(
        &self,
        id: &str,
    ) -> Result<Option<applications::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Applications::find_by_id(id).one(&self.database).await
    }

    pub async fn find_application_by_name(
        &self,
        name: &str,
    ) -> Result<Option<applications::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Applications::find()
            .filter(applications::Column::Name.eq(name))
            .one(&self.database)
            .await
    }

    // 新增：按编码查找应用（不区分大小写）
    pub async fn find_application_by_code(
        &self,
        code: &str,
    ) -> Result<Option<applications::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Applications::find()
            .filter(applications::Column::Code.eq(code))
            .filter(applications::Column::DeletedAt.is_null())
            .one(&self.database)
            .await
    }

    pub async fn find_all_applications(&self) -> Result<Vec<applications::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Applications::find().all(&self.database).await
    }

    pub async fn update_application(
        &self,
        app_data: applications::ActiveModel,
    ) -> Result<applications::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        app_data.update(&self.database).await
    }

    pub async fn delete_application(
        &self,
        id: &str,
    ) -> Result<(), sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        
        // 找到应用
        if let Some(_app) = self.find_application_by_id(id).await? {
            // 删除应用
            Applications::delete_by_id(id)
                .exec(&self.database)
                .await?;
            Ok(())
        } else {
            Err(sea_orm::DbErr::Custom("Application not found".into()))
        }
    }
}
