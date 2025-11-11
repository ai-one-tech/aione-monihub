use sea_orm::entity::prelude::*;
use crate::shared::enums::{AgentType, OsType};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "instance_records")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    pub instance_id: String,
    
    // Agent 信息
    pub agent_type: AgentType,
    pub agent_version: Option<String>,
    
    // 系统信息
    pub os_type: Option<OsType>,
    pub os_version: Option<String>,
    pub hostname: Option<String>,
    
    // 网络信息
    pub ip_address: Option<String>,
    pub public_ip: Option<String>,
    pub mac_address: Option<String>,
    pub network_type: Option<String>,
    
    // 硬件资源信息
    pub cpu_model: Option<String>,
    pub cpu_cores: Option<i32>,
    pub cpu_usage_percent: Option<Decimal>,
    pub memory_total_mb: Option<i64>,
    pub memory_used_mb: Option<i64>,
    pub memory_usage_percent: Option<Decimal>,
    pub disk_total_gb: Option<i64>,
    pub disk_used_gb: Option<i64>,
    pub disk_usage_percent: Option<Decimal>,
    
    // 运行状态
    pub process_id: Option<i32>,
    pub process_uptime_seconds: Option<i64>,
    pub thread_count: Option<i32>,
    
    // 扩展信息
    pub custom_metrics: Option<Json>,
    
    // 时间信息
    pub report_timestamp: DateTimeWithTimeZone,
    pub received_at: DateTimeWithTimeZone,
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::instances::Entity",
        from = "Column::InstanceId",
        to = "super::instances::Column::Id"
    )]
    Instance,
}

impl Related<super::instances::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Instance.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
