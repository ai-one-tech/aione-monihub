use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub status: String,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub code: String,
    pub status: String,
    pub description: String,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Application {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub code: String,
    pub status: String,
    pub description: String,
    pub authorization: Authorization,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Authorization {
    pub users: Vec<String>,
    pub expiry_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Deployment {
    pub id: String,
    pub application_id: String,
    pub private_ip: String,
    pub public_ip: String,
    pub network_interface: String,
    pub hostname: String,
    pub environment_vars: std::collections::HashMap<String, String>,
    pub service_port: i32,
    pub process_name: String,
    pub status: String,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Role {
    pub id: String,
    pub name: String,
    pub description: String,
    pub permissions: Vec<String>,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Permission {
    pub id: String,
    pub name: String,
    pub description: String,
    pub resource: String,
    pub action: String,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Log {
    pub id: String,
    pub type_: String, // Renamed from 'type' as it's a reserved keyword
    pub user_id: String,
    pub action: String,
    pub ip_address: String,
    pub user_agent: String,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub timestamp: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Machine {
    pub id: String,
    pub name: String,
    pub type_: String, // Renamed from 'type' as it's a reserved keyword
    pub status: String,
    pub deployment_id: String,
    pub application_id: String,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub id: String,
    pub code: String,
    pub environment: String,
    pub name: String,
    pub type_: String, // Renamed from 'type' as it's a reserved keyword
    pub content: String,
    pub description: String,
    pub version: i32,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}