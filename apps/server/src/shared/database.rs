use rusqlite::{Connection, Result as SqliteResult};
use std::sync::Arc;
use tokio::sync::Mutex;
use serde_json;
use chrono::{DateTime, Utc};

// Import models from individual modules
use crate::users::models::User;
use crate::projects::models::Project;
use crate::applications::models::Application;
use crate::deployments::models::Deployment;
use crate::roles::models::Role;
use crate::permissions::models::Permission;
use crate::logs::models::Log;
use crate::machines::models::Machine;
use crate::configs::models::Config;

#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new() -> SqliteResult<Self> {
        let conn = Connection::open_in_memory()?;
        
        // Initialize tables
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                status TEXT NOT NULL,
                created_by TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                deleted_at TEXT,
                revision INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                code TEXT NOT NULL,
                status TEXT NOT NULL,
                description TEXT NOT NULL,
                created_by TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                deleted_at TEXT,
                revision INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS applications (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL,
                code TEXT NOT NULL,
                status TEXT NOT NULL,
                description TEXT NOT NULL,
                authorization TEXT NOT NULL,
                created_by TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                deleted_at TEXT,
                revision INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS deployments (
                id TEXT PRIMARY KEY,
                application_id TEXT NOT NULL,
                private_ip TEXT NOT NULL,
                public_ip TEXT NOT NULL,
                network_interface TEXT NOT NULL,
                hostname TEXT NOT NULL,
                environment_vars TEXT NOT NULL,
                service_port INTEGER NOT NULL,
                process_name TEXT NOT NULL,
                status TEXT NOT NULL,
                created_by TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                deleted_at TEXT,
                revision INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS roles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                permissions TEXT NOT NULL,
                created_by TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                deleted_at TEXT,
                revision INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS permissions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                resource TEXT NOT NULL,
                action TEXT NOT NULL,
                created_by TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                deleted_at TEXT,
                revision INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS logs (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                ip_address TEXT NOT NULL,
                user_agent TEXT NOT NULL,
                created_by TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                deleted_at TEXT,
                revision INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS machines (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                deployment_id TEXT NOT NULL,
                application_id TEXT NOT NULL,
                created_by TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                deleted_at TEXT,
                revision INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS configs (
                id TEXT PRIMARY KEY,
                code TEXT NOT NULL,
                environment TEXT NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                description TEXT NOT NULL,
                version INTEGER NOT NULL,
                created_by TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                deleted_at TEXT,
                revision INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );"
        )?;
        
        Ok(Database {
            conn: Arc::new(Mutex::new(conn)),
        })
    }
    
    pub fn get_connection(&self) -> Arc<Mutex<Connection>> {
        self.conn.clone()
    }
    
    // User operations
    pub async fn create_user(&self, user: &User) -> SqliteResult<()> {
        let conn = self.conn.lock().await;
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
        let conn = self.conn.lock().await;
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
    
    // Project operations
    pub async fn create_project(&self, project: &Project) -> SqliteResult<()> {
        let conn = self.conn.lock().await;
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
    
    // Application operations
    pub async fn create_application(&self, application: &Application) -> SqliteResult<()> {
        let conn = self.conn.lock().await;
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
    
    // Deployment operations
    pub async fn create_deployment(&self, deployment: &Deployment) -> SqliteResult<()> {
        let conn = self.conn.lock().await;
        let env_vars_json = serde_json::to_string(&deployment.environment_vars).unwrap();
        conn.execute(
            "INSERT INTO deployments (id, application_id, private_ip, public_ip, network_interface, hostname, environment_vars, service_port, process_name, status, created_by, updated_by, revision, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            [
                &deployment.id,
                &deployment.application_id,
                &deployment.private_ip,
                &deployment.public_ip,
                &deployment.network_interface,
                &deployment.hostname,
                &env_vars_json,
                &deployment.service_port.to_string(),
                &deployment.process_name,
                &deployment.status,
                &deployment.created_by,
                &deployment.updated_by,
                &deployment.revision.to_string(),
                &deployment.created_at.to_rfc3339(),
                &deployment.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }
    
    // Role operations
    pub async fn create_role(&self, role: &Role) -> SqliteResult<()> {
        let conn = self.conn.lock().await;
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
    
    // Permission operations
    pub async fn create_permission(&self, permission: &Permission) -> SqliteResult<()> {
        let conn = self.conn.lock().await;
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
    
    // Log operations
    pub async fn create_log(&self, log: &Log) -> SqliteResult<()> {
        let conn = self.conn.lock().await;
        conn.execute(
            "INSERT INTO logs (id, type, user_id, action, ip_address, user_agent, created_by, updated_by, revision, timestamp, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            [
                &log.id,
                &log.type_,
                &log.user_id,
                &log.action,
                &log.ip_address,
                &log.user_agent,
                &log.created_by,
                &log.updated_by,
                &log.revision.to_string(),
                &log.timestamp.to_rfc3339(),
                &log.created_at.to_rfc3339(),
                &log.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }
    
    // Machine operations
    pub async fn create_machine(&self, machine: &Machine) -> SqliteResult<()> {
        let conn = self.conn.lock().await;
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
    
    // Config operations
    pub async fn create_config(&self, config: &Config) -> SqliteResult<()> {
        let conn = self.conn.lock().await;
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
}