use rusqlite::{Result as SqliteResult};
use crate::users::models::User;
use chrono::{DateTime, Utc};

impl super::UsersModule {
    // User operations
    pub async fn create_user(&self, user: &User) -> SqliteResult<()> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        conn.execute(
            "INSERT INTO users (id, username, email, password_hash, status, created_by, updated_by, revision, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            [
                &user.id,
                &user.username,
                &user.email,
                &user.password_hash,
                &user.status,
                &user.created_by,
                &user.updated_by,
                &user.revision.to_string(),
                &user.created_at.to_rfc3339(),
                &user.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }
    
    pub async fn get_user_by_id(&self, id: &str) -> SqliteResult<Option<User>> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        let mut stmt = conn.prepare("SELECT id, username, email, password_hash, status, created_by, updated_by, deleted_at, revision, created_at, updated_at FROM users WHERE id = ?1")?;
        let user = stmt.query_row([id], |row| {
            let deleted_at_str: Option<String> = row.get(7)?;
            let deleted_at = match deleted_at_str {
                Some(dt) => Some(dt.parse::<DateTime<Utc>>().unwrap()),
                None => None,
            };
            
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                email: row.get(2)?,
                password_hash: row.get(3)?,
                status: row.get(4)?,
                created_by: row.get(5)?,
                updated_by: row.get(6)?,
                deleted_at,
                revision: row.get(8)?,
                created_at: row.get::<_, String>(9)?.parse::<DateTime<Utc>>().unwrap(),
                updated_at: row.get::<_, String>(10)?.parse::<DateTime<Utc>>().unwrap(),
            })
        });
        
        match user {
            Ok(u) => Ok(Some(u)),
            Err(_) => Ok(None),
        }
    }
    
    // TODO: Implement other database operations for users
    // get_users, update_user, delete_user, disable_user, enable_user
}