pub mod handlers;
pub mod models;
pub mod routes;

use crate::entities::{users, Roles, Users};
use crate::shared::generate_snowflake_id;
use bcrypt::{hash, verify, DEFAULT_COST};
use sea_orm::{ActiveValue, ColumnTrait, DatabaseConnection, QueryFilter};
use chrono::Utc;


pub struct UsersModule {
    database: DatabaseConnection,
}

impl UsersModule {
    pub fn new(database: DatabaseConnection) -> Self {
        Self { database }
    }

    pub async fn create_user(
        &self,
        username: String,
        email: String,
        password: String,
        status: Option<String>,
        created_by: String,
    ) -> Result<users::Model, sea_orm::DbErr> {
        use sea_orm::ActiveModelTrait;
        
        // 生成 Snowflake ID
        let id = generate_snowflake_id()
            .map_err(|e| sea_orm::DbErr::Custom(format!("Failed to generate ID: {}", e)))?;
        
        // 对密码进行哈希
        let password_hash = hash(password, DEFAULT_COST)
            .map_err(|e| sea_orm::DbErr::Custom(format!("Failed to hash password: {}", e)))?;
        
        let now = Utc::now().into();
        
        let user_data = users::ActiveModel {
            id: ActiveValue::Set(id),
            username: ActiveValue::Set(username),
            email: ActiveValue::Set(email),
            password_hash: ActiveValue::Set(password_hash),
            status: ActiveValue::Set(status.unwrap_or_else(|| "active".to_string())),
            created_by: ActiveValue::Set(created_by.clone()),
            updated_by: ActiveValue::Set(created_by),
            deleted_at: ActiveValue::Set(None),
            revision: ActiveValue::Set(1),
            created_at: ActiveValue::Set(now),
            updated_at: ActiveValue::Set(now),
        };
        
        user_data.insert(&self.database).await
    }

    pub async fn find_user_by_id(&self, id: &str) -> Result<Option<users::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Users::find_by_id(id).one(&self.database).await
    }

    pub async fn find_user_by_username(
        &self,
        username: &str,
    ) -> Result<Option<users::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Users::find()
            .filter(users::Column::Username.eq(username))
            .one(&self.database)
            .await
    }

    pub async fn get_user_roles(&self, user_id: &str) -> Result<Vec<String>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;

        let roles = Users::find_by_id(user_id)
            .find_with_related(Roles)
            .all(&self.database)
            .await?;

        let role_names = roles
            .iter()
            .flat_map(|(_, roles)| roles.iter().map(|role| role.name.clone()))
            .collect();

        Ok(role_names)
    }

    /// 生成密码哈希
    pub fn hash_password(password: &str) -> Result<String, bcrypt::BcryptError> {
        hash(password, DEFAULT_COST)
    }

    /// 验证密码
    pub fn verify_password(password: &str, hash: &str) -> Result<bool, bcrypt::BcryptError> {
        verify(password, hash)
    }

    /// 验证用户凭据（用户名和密码）
    pub async fn verify_user_credentials(
        &self,
        username: &str,
        password: &str,
    ) -> Result<Option<users::Model>, Box<dyn std::error::Error + Send + Sync>> {
        // 首先根据用户名查找用户
        match self.find_user_by_username(username).await {
            Ok(Some(user)) => {
                // 验证密码
                match Self::verify_password(password, &user.password_hash) {
                    Ok(true) => Ok(Some(user)),
                    Ok(false) => Ok(None), // 密码错误
                    Err(err) => Err(Box::new(err)),
                }
            }
            Ok(None) => Ok(None), // 用户不存在
            Err(err) => Err(Box::new(err)),
        }
    }

    pub async fn find_all_users(&self) -> Result<Vec<users::Model>, sea_orm::DbErr> {
        use sea_orm::EntityTrait;
        Users::find().all(&self.database).await
    }
}
