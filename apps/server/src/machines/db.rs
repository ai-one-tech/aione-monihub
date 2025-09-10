use rusqlite::Result as SqliteResult;
use crate::machines::models::Machine;
use chrono::{DateTime, Utc};

impl super::MachinesModule {
    // Machine operations
    pub async fn create_machine(&self, machine: &Machine) -> SqliteResult<()> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        conn.execute(
            "INSERT INTO machines (id, name, type, status, deployment_id, application_id, created_by, updated_by, revision, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            [
                &machine.id,
                &machine.name,
                &machine.type_,
                &machine.status,
                &machine.deployment_id,
                &machine.application_id,
                &machine.created_by,
                &machine.updated_by,
                &machine.revision.to_string(),
                &machine.created_at.to_rfc3339(),
                &machine.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }
    
    pub async fn get_machine_by_id(&self, id: &str) -> SqliteResult<Option<Machine>> {
        let conn = self.database.get_connection();
        let conn = conn.lock().await;
        let mut stmt = conn.prepare("SELECT id, name, type, status, deployment_id, application_id, created_by, updated_by, deleted_at, revision, created_at, updated_at FROM machines WHERE id = ?1")?;
        let machine = stmt.query_row([id], |row| {
            let deleted_at_str: Option<String> = row.get(8)?;
            let deleted_at = match deleted_at_str {
                Some(dt) => Some(dt.parse::<DateTime<Utc>>().unwrap()),
                None => None,
            };
            
            Ok(Machine {
                id: row.get(0)?,
                name: row.get(1)?,
                type_: row.get(2)?,
                status: row.get(3)?,
                deployment_id: row.get(4)?,
                application_id: row.get(5)?,
                created_by: row.get(6)?,
                updated_by: row.get(7)?,
                deleted_at,
                revision: row.get(9)?,
                created_at: row.get::<_, String>(10)?.parse::<DateTime<Utc>>().unwrap(),
                updated_at: row.get::<_, String>(11)?.parse::<DateTime<Utc>>().unwrap(),
            })
        });
        
        match machine {
            Ok(m) => Ok(Some(m)),
            Err(_) => Ok(None),
        }
    }
    
    // TODO: Implement other database operations for machines
    // get_machines, update_machine, delete_machine, get_machine_monitoring_data
}