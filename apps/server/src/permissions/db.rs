use rusqlite::Result as SqliteResult;
use crate::permissions::models::Permission;
use chrono::{DateTime, Utc};

impl super::PermissionsModule {
    // Permission operations
    pub async fn create_permission(&self, permission: &Permission) -> SqliteResult<()> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        conn.execute(
            "INSERT INTO permissions (id, name, description, resource, action, created_by, updated_by, revision, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            [
                &permission.id,
                &permission.name,
                &permission.description,
                &permission.resource,
                &permission.action,
                &permission.created_by,
                &permission.updated_by,
                &permission.revision.to_string(),
                &permission.created_at.to_rfc3339(),
                &permission.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }
    
    pub async fn get_permission_by_id(&self, id: &str) -> SqliteResult<Option<Permission>> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        let mut stmt = conn.prepare("SELECT id, name, description, resource, action, created_by, updated_by, deleted_at, revision, created_at, updated_at FROM permissions WHERE id = ?1")?;
        let permission = stmt.query_row([id], |row| {
            let deleted_at_str: Option<String> = row.get(7)?;
            let deleted_at = match deleted_at_str {
                Some(dt) => Some(dt.parse::<DateTime<Utc>>().unwrap()),
                None => None,
            };
            
            Ok(Permission {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                resource: row.get(3)?,
                action: row.get(4)?,
                created_by: row.get(5)?,
                updated_by: row.get(6)?,
                deleted_at,
                revision: row.get(8)?,
                created_at: row.get::<_, String>(9)?.parse::<DateTime<Utc>>().unwrap(),
                updated_at: row.get::<_, String>(10)?.parse::<DateTime<Utc>>().unwrap(),
            })
        });
        
        match permission {
            Ok(p) => Ok(Some(p)),
            Err(_) => Ok(None),
        }
    }
    
    // TODO: Implement other database operations for permissions
    // get_permissions, assign_permissions, revoke_permissions
}