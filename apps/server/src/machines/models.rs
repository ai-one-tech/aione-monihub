use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use crate::shared::snowflake::generate_snowflake_id;

#[derive(Debug, Serialize, Deserialize)]
pub struct Machine {
    pub id: String,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub machine_type: String, // 映射到数据库的environment字段
    pub status: String,
    pub deployment_id: String, // 从specifications JSON中读取
    pub application_id: String, // 从specifications JSON中读取
    pub specs: Option<JsonValue>, // 映射到数据库的specifications字段
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
    pub machine_type: String,
    pub status: String,
    pub deployment_id: String,
    pub application_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MachineCreateRequest {
    pub name: String,
    pub machine_type: String,
    pub status: String,
    pub deployment_id: String,
    pub application_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MachineUpdateRequest {
    pub name: String,
    pub machine_type: String,
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

// 数据库实体与API模型转换函数
impl MachineResponse {
    pub fn from_entity(entity: crate::entities::machines::Model) -> Self {
        // 从specifications JSON中提取deployment_id和application_id
        let empty_map = serde_json::Map::new();
        let specs = entity.specifications.as_object().unwrap_or(&empty_map);
        let deployment_id = specs.get("deployment_id")
            .and_then(|v| v.as_str())
            .unwrap_or("").to_string();
        let application_id = specs.get("application_id")
            .and_then(|v| v.as_str())
            .unwrap_or("").to_string();
        
        Self {
            id: entity.id,
            name: entity.name,
            machine_type: entity.environment, // environment映射到machine_type
            status: entity.status,
            deployment_id,
            application_id,
            created_at: entity.created_at.to_rfc3339(),
            updated_at: entity.updated_at.to_rfc3339(),
        }
    }
}

// 创建请求转换为数据库实体
impl MachineCreateRequest {
    pub fn to_active_model(&self, id: String, user_id: String) -> crate::entities::machines::ActiveModel {
        use sea_orm::ActiveValue::Set;
        use chrono::Utc;
        use serde_json::json;
        
        // 将deployment_id和application_id存储到specifications JSON中
        let specifications = json!({
            "deployment_id": self.deployment_id,
            "application_id": self.application_id
        });
        
        crate::entities::machines::ActiveModel {
            id: Set(id),
            name: Set(self.name.clone()),
            hostname: Set(format!("host-{}", generate_snowflake_id())), // 生成临时hostname
            ip_address: Set("0.0.0.0".to_string()), // 默认IP，实际使用时需要修改
            status: Set(self.status.clone()),
            specifications: Set(specifications),
            environment: Set(self.machine_type.clone()), // machine_type映射到environment
            created_by: Set(user_id.clone()),
            updated_by: Set(user_id),
            deleted_at: Set(None),
            revision: Set(1),
            created_at: Set(Utc::now().into()),
            updated_at: Set(Utc::now().into()),
        }
    }
}
