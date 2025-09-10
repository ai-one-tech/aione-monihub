use rusqlite::{Connection, Result as SqliteResult};
use std::sync::Arc;
use std::fs;
use std::path::Path;
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
        println!("Initializing database...");
        
        // 确保 db 目录存在
        let db_dir = "./db";
        if !Path::new(db_dir).exists() {
            println!("Creating database directory: {}", db_dir);
            fs::create_dir_all(db_dir).map_err(|e| {
                eprintln!("Failed to create database directory: {}", e);
                rusqlite::Error::SqliteFailure(
                    rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CANTOPEN),
                    Some(format!("Failed to create database directory: {}", e))
                )
            })?
        }
        
        // 连接到文件数据库
        let db_path = "./db/monihub.db";
        println!("Connecting to database: {}", db_path);
        let conn = Connection::open(db_path)?;
        println!("Database connection established");
        
        // Initialize tables
        println!("Creating database tables and indexes...");
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS users (
                id VARCHAR PRIMARY KEY,
                username VARCHAR NOT NULL,
                email VARCHAR NOT NULL,
                password_hash VARCHAR NOT NULL,
                status VARCHAR NOT NULL,
                created_by VARCHAR NOT NULL,
                updated_by VARCHAR NOT NULL,
                deleted_at TIMESTAMP,
                revision INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS projects (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                code VARCHAR NOT NULL,
                status VARCHAR NOT NULL,
                description VARCHAR NOT NULL,
                created_by VARCHAR NOT NULL,
                updated_by VARCHAR NOT NULL,
                deleted_at TIMESTAMP,
                revision INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS applications (
                id VARCHAR PRIMARY KEY,
                project_id VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                code VARCHAR NOT NULL,
                status VARCHAR NOT NULL,
                description VARCHAR NOT NULL,
                authorization JSON NOT NULL,
                created_by VARCHAR NOT NULL,
                updated_by VARCHAR NOT NULL,
                deleted_at TIMESTAMP,
                revision INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS deployments (
                id VARCHAR PRIMARY KEY,
                application_id VARCHAR NOT NULL,
                private_ip VARCHAR NOT NULL,
                public_ip VARCHAR NOT NULL,
                network_interface VARCHAR NOT NULL,
                hostname VARCHAR NOT NULL,
                environment_vars JSON NOT NULL,
                service_port INTEGER NOT NULL,
                process_name VARCHAR NOT NULL,
                status VARCHAR NOT NULL,
                created_by VARCHAR NOT NULL,
                updated_by VARCHAR NOT NULL,
                deleted_at TIMESTAMP,
                revision INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS roles (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                description VARCHAR NOT NULL,
                permissions JSON NOT NULL,
                created_by VARCHAR NOT NULL,
                updated_by VARCHAR NOT NULL,
                deleted_at TIMESTAMP,
                revision INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS permissions (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                description VARCHAR NOT NULL,
                resource VARCHAR NOT NULL,
                action VARCHAR NOT NULL,
                created_by VARCHAR NOT NULL,
                updated_by VARCHAR NOT NULL,
                deleted_at TIMESTAMP,
                revision INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS logs (
                id VARCHAR PRIMARY KEY,
                type VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                action VARCHAR NOT NULL,
                ip_address VARCHAR NOT NULL,
                user_agent VARCHAR NOT NULL,
                created_by VARCHAR NOT NULL,
                updated_by VARCHAR NOT NULL,
                deleted_at TIMESTAMP,
                revision INTEGER NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS machines (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                type VARCHAR NOT NULL,
                status VARCHAR NOT NULL,
                deployment_id VARCHAR NOT NULL,
                application_id VARCHAR NOT NULL,
                created_by VARCHAR NOT NULL,
                updated_by VARCHAR NOT NULL,
                deleted_at TIMESTAMP,
                revision INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS configs (
                id VARCHAR PRIMARY KEY,
                code VARCHAR NOT NULL,
                environment VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                type VARCHAR NOT NULL,
                content VARCHAR NOT NULL,
                description VARCHAR NOT NULL,
                version INTEGER NOT NULL,
                created_by VARCHAR NOT NULL,
                updated_by VARCHAR NOT NULL,
                deleted_at TIMESTAMP,
                revision INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );
            
            -- Create indexes for users table
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
            
            -- Create indexes for projects table
            CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
            CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
            CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
            
            -- Create indexes for applications table
            CREATE INDEX IF NOT EXISTS idx_applications_project_id ON applications(project_id);
            CREATE INDEX IF NOT EXISTS idx_applications_code ON applications(code);
            CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
            
            -- Create indexes for deployments table
            CREATE INDEX IF NOT EXISTS idx_deployments_application_id ON deployments(application_id);
            CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
            CREATE INDEX IF NOT EXISTS idx_deployments_hostname ON deployments(hostname);
            
            -- Create indexes for roles table
            CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
            
            -- Create indexes for permissions table
            CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
            CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
            
            -- Create indexes for logs table
            CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
            
            -- Create indexes for machines table
            CREATE INDEX IF NOT EXISTS idx_machines_deployment_id ON machines(deployment_id);
            CREATE INDEX IF NOT EXISTS idx_machines_application_id ON machines(application_id);
            CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
            
            -- Create indexes for configs table
            CREATE INDEX IF NOT EXISTS idx_configs_code ON configs(code);
            CREATE INDEX IF NOT EXISTS idx_configs_environment ON configs(environment);
            CREATE INDEX IF NOT EXISTS idx_configs_version ON configs(version);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_configs_code_env_version ON configs(code, environment, version);"
        )?;
        
        println!("Database initialization completed successfully");
        
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
        conn.execute(
            "INSERT INTO applications (id, project_id, name, code, status, description, authorization, created_by, updated_by, revision, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            [
                &application.id,
                &application.project_id,
                &application.name,
                &application.code,
                &application.status,
                &application.description,
                &serde_json::to_string(&application.authorization).unwrap(),
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
        conn.execute(
            "INSERT INTO deployments (id, application_id, private_ip, public_ip, network_interface, hostname, environment_vars, service_port, process_name, status, created_by, updated_by, revision, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            [
                &deployment.id,
                &deployment.application_id,
                &deployment.private_ip,
                &deployment.public_ip,
                &deployment.network_interface,
                &deployment.hostname,
                &serde_json::to_string(&deployment.environment_vars).unwrap(),
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
        conn.execute(
            "INSERT INTO roles (id, name, description, permissions, created_by, updated_by, revision, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            [
                &role.id,
                &role.name,
                &role.description,
                &serde_json::to_string(&role.permissions).unwrap(),
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