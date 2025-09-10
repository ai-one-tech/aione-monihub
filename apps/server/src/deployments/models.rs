use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct Deployment {
    pub id: String,
    pub application_id: String,
    pub private_ip: String,
    pub public_ip: String,
    pub network_interface: String,
    pub hostname: String,
    pub environment_vars: HashMap<String, String>,
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
pub struct DeploymentResponse {
    pub id: String,
    pub application_id: String,
    pub private_ip: String,
    pub public_ip: String,
    pub network_interface: String,
    pub hostname: String,
    pub environment_vars: HashMap<String, String>,
    pub service_port: u16,
    pub process_name: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeploymentCreateRequest {
    pub application_id: String,
    pub private_ip: String,
    pub public_ip: String,
    pub network_interface: String,
    pub hostname: String,
    pub environment_vars: HashMap<String, String>,
    pub service_port: u16,
    pub process_name: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeploymentUpdateRequest {
    pub application_id: String,
    pub private_ip: String,
    pub public_ip: String,
    pub network_interface: String,
    pub hostname: String,
    pub environment_vars: HashMap<String, String>,
    pub service_port: u16,
    pub process_name: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MonitoringDataResponse {
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub disk_usage: f64,
    pub network_traffic: NetworkTraffic,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkTraffic {
    pub incoming: f64,
    pub outgoing: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeploymentListResponse {
    pub data: Vec<DeploymentResponse>,
    pub pagination: Pagination,
    pub timestamp: u64,
    pub trace_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Pagination {
    pub page: u32,
    pub limit: u32,
    pub total: u32,
}

// Query parameters for deployment list
#[derive(Debug, Deserialize)]
pub struct DeploymentListQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
    pub application_id: Option<String>,
    pub status: Option<String>,
}