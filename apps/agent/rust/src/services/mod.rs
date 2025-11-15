/// 服务模块入口
///
/// 提供应用状态与各类服务（上报、任务）的统一管理入口。
use crate::{config::Config, log_store::AgentLogStore};
use std::sync::{
    atomic::AtomicBool,
    Arc,
};
use once_cell::sync::OnceCell;

#[derive(Clone)]
/// 应用全局状态：包含配置、日志存储与 HTTP 可用标志
pub struct AppState {
    pub cfg: Config,
    pub logs: AgentLogStore,
    pub http_enabled: Arc<AtomicBool>,
    pub public_ip: Arc<OnceCell<String>>, 
}
impl AppState {
    /// 构建新的应用状态实例
    pub fn new(cfg: Config) -> Self {
        Self {
            cfg,
            logs: AgentLogStore::new(),
            http_enabled: Arc::new(AtomicBool::new(true)),
            public_ip: Arc::new(OnceCell::new()),
        }
    }
}

pub mod report;
pub mod tasks;
