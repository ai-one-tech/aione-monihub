/// Agent 内部日志缓冲区
///
/// 采集运行过程中的轻量日志，并在实例上报时批量提交后清空。
use crate::models::AgentLogItem;
use chrono::Utc;
use std::sync::{Arc, Mutex};
use uuid::Uuid;


#[derive(Clone)]
pub struct AgentLogStore {
    inner: Arc<Mutex<Vec<AgentLogItem>>>,
}
impl AgentLogStore {
    /// 创建一个新的日志缓冲区
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(Vec::new())),
        }
    }
    /// 推入一条日志
    pub fn push(&self, level: &str, message: &str) {
        self.inner.lock().unwrap().push(AgentLogItem {
            id: Uuid::new_v4(),
            level: level.to_string(),
            message: message.to_string(),
            ts: Utc::now(),
        });
    }
    /// 快照并清空当前缓冲区
    pub fn snapshot_and_clear(&self) -> Vec<AgentLogItem> {
        let mut g = self.inner.lock().unwrap();
        let v = g.clone();
        g.clear();
        v
    }
}
