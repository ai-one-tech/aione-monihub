use rusqlite::{Result as SqliteResult};
use crate::projects::models::Project;
use chrono::{DateTime, Utc};

impl super::ProjectsModule {
    // Project operations
    pub async fn create_project(&self, project: &Project) -> SqliteResult<()> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        conn.execute(
            "INSERT INTO projects (id, name, code, status, description, created_by, updated_by, revision, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            [
                &project.id,
                &project.name,
                &project.code,
                &project.status,
                &project.description,
                &project.created_by,
                &project.updated_by,
                &project.revision.to_string(),
                &project.created_at.to_rfc3339(),
                &project.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }
    
    pub async fn get_project_by_id(&self, id: &str) -> SqliteResult<Option<Project>> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        let mut stmt = conn.prepare("SELECT id, name, code, status, description, created_by, updated_by, deleted_at, revision, created_at, updated_at FROM projects WHERE id = ?1")?;
        let project = stmt.query_row([id], |row| {
            let deleted_at_str: Option<String> = row.get(7)?;
            let deleted_at = match deleted_at_str {
                Some(dt) => Some(dt.parse::<DateTime<Utc>>().unwrap()),
                None => None,
            };
            
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                code: row.get(2)?,
                status: row.get(3)?,
                description: row.get(4)?,
                created_by: row.get(5)?,
                updated_by: row.get(6)?,
                deleted_at,
                revision: row.get(8)?,
                created_at: row.get::<_, String>(9)?.parse::<DateTime<Utc>>().unwrap(),
                updated_at: row.get::<_, String>(10)?.parse::<DateTime<Utc>>().unwrap(),
            })
        });
        
        match project {
            Ok(p) => Ok(Some(p)),
            Err(_) => Ok(None),
        }
    }
    
    // TODO: Implement other database operations for projects
    // get_projects, update_project, delete_project
}