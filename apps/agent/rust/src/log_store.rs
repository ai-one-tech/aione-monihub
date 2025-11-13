use crate::models::AgentLogItem;
use chrono::Utc;
use uuid::Uuid;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct AgentLogStore { inner: Arc<Mutex<Vec<AgentLogItem>>> }
impl AgentLogStore {
    pub fn new() -> Self { Self { inner: Arc::new(Mutex::new(Vec::new())) } }
    pub fn push(&self, level: &str, message: &str) { self.inner.lock().unwrap().push(AgentLogItem { id: Uuid::new_v4(), level: level.to_string(), message: message.to_string(), ts: Utc::now() }); }
    pub fn snapshot_and_clear(&self) -> Vec<AgentLogItem> { let mut g = self.inner.lock().unwrap(); let v = g.clone(); g.clear(); v }
}

