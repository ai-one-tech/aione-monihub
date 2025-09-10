use rusqlite::Result as SqliteResult;
use crate::configs::models::Config;
use chrono::{DateTime, Utc};

impl super::ConfigsModule {
    // Config operations
    pub async fn create_config(&self, config: &Config) -> SqliteResult<()> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        conn.execute(
            "INSERT INTO configs (id, code, environment, name, type, content, description, version, created_by, updated_by, revision, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            [
                &config.id,
                &config.code,
                &config.environment,
                &config.name,
                &config.type_,
                &config.content,
                &config.description,
                &config.version.to_string(),
                &config.created_by,
                &config.updated_by,
                &config.revision.to_string(),
                &config.created_at.to_rfc3339(),
                &config.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }
    
    pub async fn get_config_by_id(&self, id: &str) -> SqliteResult<Option<Config>> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        let mut stmt = conn.prepare("SELECT id, code, environment, name, type, content, description, version, created_by, updated_by, deleted_at, revision, created_at, updated_at FROM configs WHERE id = ?1")?;
        let config = stmt.query_row([id], |row| {
            let deleted_at_str: Option<String> = row.get(10)?;
            let deleted_at = match deleted_at_str {
                Some(dt) => Some(dt.parse::<DateTime<Utc>>().unwrap()),
                None => None,
            };
            
            Ok(Config {
                id: row.get(0)?,
                code: row.get(1)?,
                environment: row.get(2)?,
                name: row.get(3)?,
                type_: row.get(4)?,
                content: row.get(5)?,
                description: row.get(6)?,
                version: row.get(7)?,
                created_by: row.get(8)?,
                updated_by: row.get(9)?,
                deleted_at,
                revision: row.get(11)?,
                created_at: row.get::<_, String>(12)?.parse::<DateTime<Utc>>().unwrap(),
                updated_at: row.get::<_, String>(13)?.parse::<DateTime<Utc>>().unwrap(),
            })
        });
        
        match config {
            Ok(c) => Ok(Some(c)),
            Err(_) => Ok(None),
        }
    }
    
    // TODO: Implement other database operations for configs
    // get_configs, delete_config, get_config_by_code, get_config_by_code_and_environment, get_config_by_code_env_and_version
}