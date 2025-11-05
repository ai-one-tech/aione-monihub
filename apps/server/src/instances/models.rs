use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use crate::shared::snowflake::generate_snowflake_id;

#[derive(Debug, Serialize, Deserialize)]
pub struct Instance {
    pub id: String,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub instance_type: String,
    pub status: String,
    pub application_id: String,
    pub specs: Option<JsonValue>,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTime<Utc>>,
    pub revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstanceResponse {
    pub id: String,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub instance_type: String,
    pub status: String,
    pub application_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mac_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub public_ip: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub program_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub os_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub os_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub first_report_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_report_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub report_count: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_fields: Option<JsonValue>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstanceCreateRequest {
    pub name: String,
    pub instance_type: String,
    pub status: String,
    pub application_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mac_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub public_ip: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub program_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub os_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub os_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_fields: Option<JsonValue>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstanceUpdateRequest {
    pub name: String,
    pub instance_type: String,
    pub status: String,
    pub application_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstanceMonitoringDataResponse {
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstanceListResponse {
    pub data: Vec<InstanceResponse>,
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

// Query parameters for instance list
#[derive(Debug, Deserialize)]
pub struct InstanceListQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
    pub status: Option<String>,
    pub application_id: Option<String>,
    pub ip_address: Option<String>,
    pub public_ip: Option<String>,
    pub hostname: Option<String>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
}

// 数据库实体与API模型转换函数
impl InstanceResponse {
    pub fn from_entity(entity: crate::entities::instances::Model) -> Self {
        Self {
            id: entity.id,
            name: entity.name,
            hostname: entity.hostname,
            ip_address: entity.ip_address,
            instance_type: entity.environment,
            status: entity.status,
            application_id: entity.application_id,
            mac_address: entity.mac_address,
            public_ip: entity.public_ip,
            port: entity.port,
            program_path: entity.program_path,
            os_type: entity.os_type,
            os_version: entity.os_version,
            first_report_at: entity.first_report_at.map(|v| v.to_rfc3339()),
            last_report_at: entity.last_report_at.map(|v| v.to_rfc3339()),
            report_count: entity.report_count,
            custom_fields: entity.custom_fields,
            created_at: entity.created_at.to_rfc3339(),
            updated_at: entity.updated_at.to_rfc3339(),
        }
    }
}

impl InstanceCreateRequest {
    pub fn to_active_model(&self, id: String, user_id: String) -> crate::entities::instances::ActiveModel {
        use sea_orm::ActiveValue::Set;
        use chrono::Utc;
        
        crate::entities::instances::ActiveModel {
            id: Set(id),
            name: Set(self.name.clone()),
            hostname: Set(format!("host-{}", generate_snowflake_id())),
            ip_address: Set("0.0.0.0".to_string()),
            status: Set(self.status.clone()),
            environment: Set(self.instance_type.clone()),
            application_id: Set(self.application_id.clone()),
            mac_address: Set(self.mac_address.clone()),
            public_ip: Set(self.public_ip.clone()),
            port: Set(self.port),
            program_path: Set(self.program_path.clone()),
            os_type: Set(self.os_type.clone()),
            os_version: Set(self.os_version.clone()),
            first_report_at: Set(None),
            last_report_at: Set(None),
            report_count: Set(Some(0)),
            custom_fields: Set(self.custom_fields.clone()),
            agent_type: Set(None),
            agent_version: Set(None),
            cpu_usage_percent: Set(None),
            memory_usage_percent: Set(None),
            disk_usage_percent: Set(None),
            process_uptime_seconds: Set(None),
            network_type: Set(None),
            created_by: Set(user_id.clone()),
            updated_by: Set(user_id),
            deleted_at: Set(None),
            revision: Set(1),
            created_at: Set(Utc::now().into()),
            updated_at: Set(Utc::now().into()),
        }
    }
}
