use rusqlite::Result as SqliteResult;
use crate::roles::models::Role;
use chrono::{DateTime, Utc};
use serde_json;

impl super::RolesModule {
    // Role operations
    pub async fn create_role(&self, role: &Role) -> SqliteResult<()> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        let permissions_json = serde_json::to_string(&role.permissions).unwrap();
        conn.execute(
            "INSERT INTO roles (id, name, description, permissions, created_by, updated_by, revision, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            [
                &role.id,
                &role.name,
                &role.description,
                &permissions_json,
                &role.created_by,
                &role.updated_by,
                &role.revision.to_string(),
                &role.created_at.to_rfc3339(),
                &role.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }
    
    pub async fn get_role_by_id(&self, id: &str) -> SqliteResult<Option<Role>> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        let mut stmt = conn.prepare("SELECT id, name, description, permissions, created_by, updated_by, deleted_at, revision, created_at, updated_at FROM roles WHERE id = ?1")?;
        let role = stmt.query_row([id], |row| {
            let deleted_at_str: Option<String> = row.get(6)?;
            let deleted_at = match deleted_at_str {
                Some(dt) => Some(dt.parse::<DateTime<Utc>>().unwrap()),
                None => None,
            };
            
            let permissions_str: String = row.get(3)?;
            let permissions = serde_json::from_str(&permissions_str).unwrap();
            
            Ok(Role {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                permissions,
                created_by: row.get(4)?,
                updated_by: row.get(5)?,
                deleted_at,
                revision: row.get(7)?,
                created_at: row.get::<_, String>(8)?.parse::<DateTime<Utc>>().unwrap(),
                updated_at: row.get::<_, String>(9)?.parse::<DateTime<Utc>>().unwrap(),
            })
        });
        
        match role {
            Ok(r) => Ok(Some(r)),
            Err(_) => Ok(None),
        }
    }
    
    // TODO: Implement other database operations for roles
    // get_roles, update_role, delete_role
}