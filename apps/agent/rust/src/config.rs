use std::fs;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use dirs::cache_dir;

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct Config {
    pub server_url: String,
    pub agent_type: String,
    pub agent_version: String,
    pub debug: bool,
    pub report: ReportConfig,
    pub task: TaskConfig,
    pub file: FileConfig,
    pub http: HttpConfig,
    pub instance_id: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ReportConfig { pub enabled: bool, pub interval_seconds: u64 }
impl Default for ReportConfig { fn default() -> Self { Self { enabled: true, interval_seconds: 30 } } }

#[derive(Clone, Serialize, Deserialize)]
pub struct TaskConfig { pub enabled: bool, pub long_poll_enabled: bool, pub long_poll_timeout_seconds: u64, pub max_concurrent_tasks: usize }
impl Default for TaskConfig { fn default() -> Self { Self { enabled: true, long_poll_enabled: true, long_poll_timeout_seconds: 30, max_concurrent_tasks: 2 } } }

#[derive(Clone, Serialize, Deserialize)]
pub struct FileConfig { pub upload_dir: String, pub max_upload_size_mb: u64 }
impl Default for FileConfig { fn default() -> Self { Self { upload_dir: String::from("uploads"), max_upload_size_mb: 1024 } } }

#[derive(Clone, Serialize, Deserialize)]
pub struct HttpConfig { pub proxy_enabled: bool, pub proxy_url: Option<String>, pub proxy_username: Option<String>, pub proxy_password: Option<String>, pub verify_tls: bool }
impl Default for HttpConfig { fn default() -> Self { Self { proxy_enabled: false, proxy_url: None, proxy_username: None, proxy_password: None, verify_tls: true } } }

impl Config {
    pub fn load(path: &str) -> anyhow::Result<Self> {
        let mut cfg = if path.is_empty() { Self::default_fallback() } else { Self::from_file(path)? };
        if cfg.instance_id.is_empty() { cfg.instance_id = Self::persist_instance_id()?; }
        Ok(cfg)
    }
    fn default_fallback() -> Self {
        let server_url = std::env::var("MONIHUB_SERVER_URL").unwrap_or_else(|_| String::from("http://localhost:3000"));
        Self { server_url, agent_type: String::from("rust-agent"), agent_version: String::from("0.1.0"), debug: false, report: ReportConfig::default(), task: TaskConfig::default(), file: FileConfig::default(), http: HttpConfig::default(), instance_id: String::new() }
    }
    fn from_file(path: &str) -> anyhow::Result<Self> { Ok(serde_yaml::from_str(&fs::read_to_string(path)?)?) }
    fn persist_instance_id() -> anyhow::Result<String> {
        let dir = cache_dir().unwrap_or_else(|| PathBuf::from("."));
        let base = dir.join("monihub").join("config");
        fs::create_dir_all(&base)?;
        let f = base.join("instance_id");
        if f.exists() { return Ok(fs::read_to_string(&f)?.trim().to_string()); }
        let id = Uuid::new_v4().to_string();
        fs::write(&f, &id)?;
        Ok(id)
    }
}

