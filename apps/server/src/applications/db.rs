use rusqlite::{Result as SqliteResult};
use crate::applications::models::Application;
use serde_json;

impl super::ApplicationsModule {
    // Application operations
    pub async fn create_application(&self, application: &Application) -> SqliteResult<()> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        let authorization_json = serde_json::to_string(&application.authorization).unwrap();
        conn.execute(
            "INSERT INTO applications (id, project_id, name, code, status, description, authorization, created_by, updated_by, revision, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            [
                &application.id,
                &application.project_id,
                &application.name,
                &application.code,
                &application.status,
                &application.description,
                &authorization_json,
                &application.created_by,
                &application.updated_by,
                &application.revision.to_string(),
                &application.created_at.to_rfc3339(),
                &application.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }
    
    // TODO: Implement other database operations for applications
    // get_application_by_id, get_applications, update_application, delete_application
}