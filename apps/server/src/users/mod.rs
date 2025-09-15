pub mod handlers;
pub mod models;
pub mod routes;

use crate::entities::{users, Roles, Users, PasswordResetTokens};
use crate::entities::password_reset_tokens;
use crate::shared::generate_snowflake_id;
use bcrypt::{hash, verify, DEFAULT_COST};
use sea_orm::{ActiveValue, ColumnTrait, DatabaseConnection, QueryFilter, ActiveModelTrait};
use chrono::{Utc, Duration};


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
        let id = generate_snowflake_id();
        
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

    /// 创建密码重置令牌
    pub async fn create_password_reset_token(
        &self,
        user_id: &str,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // 生成唯一的重置令牌
        let token = generate_snowflake_id();
        
        // 生成 Snowflake ID
        let id = generate_snowflake_id();
        
        // 设置令牌过期时间（24小时后）
        let expires_at = Utc::now() + Duration::hours(24);
        
        // 保存令牌到数据库
        let reset_token = password_reset_tokens::ActiveModel {
            id: ActiveValue::Set(id),
            user_id: ActiveValue::Set(user_id.to_string()),
            token: ActiveValue::Set(token.clone()),
            expires_at: ActiveValue::Set(expires_at.into()),
            used_at: ActiveValue::Set(None),
            created_at: ActiveValue::Set(Utc::now().into()),
        };
        
        reset_token.insert(&self.database).await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
        
        Ok(token)
    }

    /// 验证并使用密码重置令牌
    pub async fn verify_and_use_reset_token(
        &self,
        token: &str,
    ) -> Result<Option<String>, Box<dyn std::error::Error + Send + Sync>> {
        use sea_orm::EntityTrait;
        
        // 查找令牌
        let reset_token = PasswordResetTokens::find()
            .filter(password_reset_tokens::Column::Token.eq(token))
            .filter(password_reset_tokens::Column::UsedAt.is_null())
            .filter(password_reset_tokens::Column::ExpiresAt.gt(Utc::now()))
            .one(&self.database)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
        
        match reset_token {
            Some(token_record) => {
                // 保存 user_id 在更新之前
                let user_id = token_record.user_id.clone();
                
                // 标记令牌为已使用
                let mut active_token: password_reset_tokens::ActiveModel = token_record.into();
                active_token.used_at = ActiveValue::Set(Some(Utc::now().into()));
                active_token.update(&self.database).await
                    .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
                
                Ok(Some(user_id))
            }
            None => Ok(None), // 令牌无效、已使用或已过期
        }
    }

    /// 更新用户密码
    pub async fn update_user_password(
        &self,
        user_id: &str,
        new_password: &str,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        use sea_orm::EntityTrait;
        
        // 查找用户
        let user = Users::find_by_id(user_id)
            .one(&self.database)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
        
        match user {
            Some(user_record) => {
                // 加密新密码
                let password_hash = Self::hash_password(new_password)
                    .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
                
                // 更新用户密码
                let mut active_user: users::ActiveModel = user_record.into();
                active_user.password_hash = ActiveValue::Set(password_hash);
                active_user.updated_at = ActiveValue::Set(Utc::now().into());
                active_user.revision = ActiveValue::Set(active_user.revision.unwrap() + 1);
                
                active_user.update(&self.database).await
                    .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
                
                Ok(())
            }
            None => Err("用户不存在".into()),
        }
    }

    /// 清理过期的密码重置令牌
    pub async fn cleanup_expired_reset_tokens(&self) -> Result<u64, sea_orm::DbErr> {
        use sea_orm::{EntityTrait, QueryFilter};
        
        let result = PasswordResetTokens::delete_many()
            .filter(
                password_reset_tokens::Column::ExpiresAt.lt(Utc::now())
                    .or(password_reset_tokens::Column::UsedAt.is_not_null())
            )
            .exec(&self.database)
            .await?;
        
        Ok(result.rows_affected)
    }
}
