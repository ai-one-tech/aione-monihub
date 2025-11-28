use crate::agent_logger;
/// 配置模块
///
/// 提供 Agent 运行所需的所有配置项：服务端地址、代理、上报与任务参数等。
/// 支持从 YAML 文件或环境变量加载，并自动为 `instance_id` 进行本地持久化。
use dirs::cache_dir;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize, Default)]
#[serde(default)]
/// Agent 总体配置
pub struct Config {
    pub server_url: String,
    pub application_code: String,
    pub agent_type: String,
    pub agent_version: String,
    pub debug: bool,
    pub report: ReportConfig,
    pub task: TaskConfig,
    pub file: FileConfig,
    pub http: HttpConfig,
    pub agent_instance_id: Option<String>,
    pub instance_id: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(default)]
/// 上报配置
pub struct ReportConfig {
    pub enabled: bool,
    pub interval_seconds: u64,
}
impl Default for ReportConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            interval_seconds: 30,
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(default)]
/// 任务配置
pub struct TaskConfig {
    pub enabled: bool,
    pub long_poll_enabled: bool,
    pub long_poll_timeout_seconds: u64,
    pub max_concurrent_tasks: usize,
}
impl Default for TaskConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            long_poll_enabled: true,
            long_poll_timeout_seconds: 30,
            max_concurrent_tasks: 2,
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(default)]
/// 文件相关配置（预留）
pub struct FileConfig {
    pub upload_dir: String,
    pub max_upload_size_mb: u64,
}
impl Default for FileConfig {
    fn default() -> Self {
        Self {
            upload_dir: String::from("uploads"),
            max_upload_size_mb: 1024,
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(default)]
/// HTTP 代理与 TLS 验证配置
pub struct HttpConfig {
    pub proxy_enabled: bool,
    pub proxy_url: Option<String>,
    pub proxy_username: Option<String>,
    pub proxy_password: Option<String>,
    pub verify_tls: bool,
}
impl Default for HttpConfig {
    fn default() -> Self {
        Self {
            proxy_enabled: false,
            proxy_url: None,
            proxy_username: None,
            proxy_password: None,
            verify_tls: true,
        }
    }
}

impl Config {
    /// 加载配置:优先级为 启动参数 > 环境变量 > 配置文件 > 默认值
    /// 若 `instance_id` 缺失或为空,将生成并持久化一个新的实例 ID。
    pub fn load(
        path: &str,
        cli_server_url: Option<String>,
        cli_application_code: Option<String>,
        cli_debug: Option<bool>,
    ) -> anyhow::Result<Self> {
        let mut config_path = path;

        let mut config = Self::default_fallback();
        if config_path.is_empty() {
            config_path = "./config.yaml";
        }
        
        // 1. 从配置文件加载
        if Path::new(config_path).exists() {
            match Self::from_file(config_path) {
                Ok(file_cfg) => {
                    if file_cfg.debug {
                        config.debug = true;
                    }
                    if !file_cfg.server_url.is_empty() {
                        config.server_url = file_cfg.server_url;
                    }
                    if !file_cfg.application_code.is_empty() {
                        config.application_code = file_cfg.application_code;
                    }
                }
                Err(err) => {
                    agent_logger::error(&format!(
                        "读取配置文件失败: {},错误: {}",
                        config_path, err
                    ));
                    if let Ok(cwd) = std::env::current_dir() {
                        agent_logger::error(&format!("当前工作目录: {}", cwd.display()));
                    }
                }
            }
        } else {
            agent_logger::error(&format!("配置文件未找到: {}", config_path));
            if let Ok(cwd) = std::env::current_dir() {
                agent_logger::error(&format!("当前工作目录: {}", cwd.display()));
            }
        }

        // 2. 从环境变量加载(覆盖配置文件)
        if let Ok(env_server_url) = std::env::var("MONIHUB_SERVER_URL") {
            if !env_server_url.is_empty() {
                config.server_url = env_server_url;
            }
        }
        if let Ok(env_application_code) = std::env::var("MONIHUB_APPLICATION_CODE") {
            if !env_application_code.is_empty() {
                config.application_code = env_application_code;
            }
        }
        if let Ok(env_debug) = std::env::var("MONIHUB_DEBUG") {
            if let Ok(debug_val) = env_debug.parse::<bool>() {
                config.debug = debug_val;
            }
        }

        // 3. 从启动参数加载(最高优先级)
        if let Some(url) = cli_server_url {
            if !url.is_empty() {
                config.server_url = url;
            }
        }
        if let Some(app_code) = cli_application_code {
            if !app_code.is_empty() {
                config.application_code = app_code;
            }
        }
        if let Some(debug_val) = cli_debug {
            config.debug = debug_val;
        }

        if config.application_code.is_empty(){
            agent_logger::error("请设置 application_code");
            return Err(anyhow::anyhow!("请设置 application_code"));
        }

        // 读取 agent_instance_id， 先读取本地的配置，如果没有的话就生成一个，并且持久化到当前系统的配置文件中
        if config
            .agent_instance_id
            .as_ref()
            .map(|s| s.is_empty())
            .unwrap_or(true)
        {
            config.agent_instance_id = Some(Self::persist_instance_id(config.clone())?);
        }
        Ok(config)
    }
    /// 默认配置，部分值可通过环境变量覆盖
    fn default_fallback() -> Self {
        Self {
            server_url: String::from("http://localhost:9080"),
            agent_type: String::from("rust-agent"),
            agent_version: String::from("1.0.0"),
            debug: false,
            report: ReportConfig::default(),
            task: TaskConfig::default(),
            file: FileConfig::default(),
            http: HttpConfig::default(),
            agent_instance_id: None,
            application_code: String::new(),
            instance_id: None,
        }
    }
    /// 从 YAML 文件加载配置
    fn from_file(path: &str) -> anyhow::Result<Self> {
        Ok(serde_yaml::from_str(&fs::read_to_string(path)?)?)
    }
    /// 将实例 ID 持久化到本地缓存目录，并在不存在时生成一个新 ID
    fn persist_instance_id(config: Config) -> anyhow::Result<String> {
        let dir = cache_dir().unwrap_or_else(|| PathBuf::from("."));
        let base = dir.join("monihub").join(config.application_code);
        fs::create_dir_all(&base)?;
        let f = base.join("config.json");
        if f.exists() {
            let content = fs::read_to_string(&f)?;
            return match serde_json::from_str::<serde_json::Value>(&content) {
                Ok(serde_json::Value::Object(mut obj)) => {
                    if let Some(v) = obj.get("agent_instance_id").and_then(|v| v.as_str()) {
                        if !v.is_empty() {
                            return Ok(v.to_string());
                        }
                    }
                    let id = Uuid::new_v4().to_string();
                    obj.insert("agent_instance_id".to_string(), serde_json::json!(id));
                    fs::write(
                        &f,
                        serde_json::to_string_pretty(&serde_json::Value::Object(obj))?,
                    )?;
                    Ok(id)
                }
                _ => {
                    let id = Uuid::new_v4().to_string();
                    let obj = serde_json::json!({ "agent_instance_id": id });
                    fs::write(&f, serde_json::to_string_pretty(&obj)?)?;
                    Ok(id)
                }
            }
        }
        let id = Uuid::new_v4().to_string();
        let obj = serde_json::json!({ "agent_instance_id": id });
        fs::write(&f, serde_json::to_string_pretty(&obj)?)?;
        Ok(id)
    }
}
