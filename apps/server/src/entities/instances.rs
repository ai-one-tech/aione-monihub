use crate::shared::enums::{AgentType, OnlineStatus, OsType, Status};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "instances")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    pub agent_instance_id: Option<String>,
    pub hostname: String,
    pub ip_address: String,
    pub status: Status,
    pub online_status: OnlineStatus,
    pub environment: Option<Json>,
    pub application_id: String,
    pub mac_address: Option<String>,
    pub public_ip: Option<String>,
    pub port: Option<i32>,
    pub program_path: Option<String>,
    pub profiles: Option<String>,
    pub os_type: Option<OsType>,
    pub os_version: Option<String>,
    pub first_report_at: Option<DateTimeWithTimeZone>,
    pub last_report_at: Option<DateTimeWithTimeZone>,
    pub report_count: Option<i32>,
    pub custom_fields: Option<Json>,
    pub config: Option<Json>,
    pub agent_type: Option<AgentType>,
    pub agent_version: Option<String>,
    pub cpu_usage_percent: Option<Decimal>,
    pub memory_usage_percent: Option<Decimal>,
    pub disk_usage_percent: Option<Decimal>,
    pub process_uptime_seconds: Option<i64>,
    pub network_type: Option<String>,
    pub offline_at: Option<DateTimeWithTimeZone>,
    pub created_by: String,
    pub updated_by: String,
    pub deleted_at: Option<DateTimeWithTimeZone>,
    pub revision: i32,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
