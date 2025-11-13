use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
use crate::{config::Config, log_store::AgentLogStore};

#[derive(Clone)]
pub struct AppState { pub cfg: Config, pub logs: AgentLogStore, pub http_enabled: Arc<AtomicBool> }
impl AppState { pub fn new(cfg: Config) -> Self { Self { cfg, logs: AgentLogStore::new(), http_enabled: Arc::new(AtomicBool::new(true)) } } }

pub mod report;
pub mod tasks;

