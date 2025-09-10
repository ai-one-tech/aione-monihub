use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

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
pub struct MachineResponse {
    pub id: String,
    pub name: String,
    pub type_: String,
    pub status: String,
    pub deployment_id: String,
    pub application_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MachineCreateRequest {
    pub name: String,
    pub type_: String,
    pub status: String,
    pub deployment_id: String,
    pub application_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MachineUpdateRequest {
    pub name: String,
    pub type_: String,
    pub status: String,
    pub deployment_id: String,
    pub application_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MachineMonitoringDataResponse {
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
pub struct MachineListResponse {
    pub data: Vec<MachineResponse>,
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

// Query parameters for machine list
#[derive(Debug, Deserialize)]
pub struct MachineListQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
    pub status: Option<String>,
    pub deployment_id: Option<String>,
    pub application_id: Option<String>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
}