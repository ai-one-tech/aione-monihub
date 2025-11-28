use crate::utils::http_util;
/// 实例信息上报服务
///
/// 周期性采集系统/网络/硬件/运行时信息，构造上报请求并提交至服务端。
/// 当服务端返回 403 时，标记 `http_enabled=false`，以便任务服务暂停轮询。
use crate::{
    agent_logger,
    models::{
        AgentLogWire, HardwareInfo, InstanceReportRequest, NetworkInfo, RuntimeInfo, SystemInfo,
    },
    services::AppState,
};
use chrono::Utc;
use gethostname::gethostname;
use os_info::Type;
use serde_json::json;
use sysinfo::{Disks, System};
use tokio::time::{sleep, Duration};

pub async fn start(state: AppState) {
    let interval = state.cfg.report.interval_seconds;
    if let Some(ip) = fetch_public_ip().await {
        let _ = state.public_ip.set(ip);
    }
    tokio::spawn(async move {
        loop {
            if state.cfg.report.enabled {
                agent_logger::info("准备进行实例信息上报");
                let req = build_report(&state).await;
                let url = format!("{}/api/open/instances/report", state.cfg.server_url);
                let res = http_util::post(url, &req).await;
                match res {
                    Ok(r) => {
                        let code = r.status().as_u16();
                        let success = r.status().is_success();
                        if success {
                            state
                                .http_enabled
                                .store(true, std::sync::atomic::Ordering::SeqCst);

                            agent_logger::info(&format!("上报成功 http={}", code));
                        } else {
                            state
                                .http_enabled
                                .store(false, std::sync::atomic::Ordering::SeqCst);
                            let body = r.text().await.unwrap_or_default();
                            agent_logger::warn(&format!("服务端返回 http={} body={}", code, body));
                        }
                    }
                    Err(e) => {
                        agent_logger::warn(&format!("上报失败: {}", e));
                    }
                }
            }
            sleep(Duration::from_secs(interval)).await;
        }
    });
}

/// 构造上报请求体（字段命名与 Java Agent 对齐）
async fn build_report(state: &AppState) -> InstanceReportRequest {
    let mut sys = sysinfo::System::new_all();
    sys.refresh_all();
    let os = os_info::get();
    let system = SystemInfo {
        os_type: format_os(os.os_type()),
        os_version: os.version().to_string(),
        hostname: gethostname().to_string_lossy().to_string(),
    };

    let ips = local_ips();
    let ip_primary = pick_primary_ip(&ips);
    let macs_list = macs();
    let mac_primary = macs_list.get(0).cloned();
    let public_ip = state.public_ip.get().cloned();
    let network = NetworkInfo {
        ip_address: ip_primary,
        mac_address: mac_primary,
        public_ip,
        network_type: None,
        port: None,
    };

    let cpu_usage = 0.0f64;
    let total_mb = (sys.total_memory() / 1024) as i64;
    let used_mb = (sys.used_memory() / 1024) as i64;
    let mem_pct = if total_mb > 0 {
        (used_mb as f64) * 100.0 / (total_mb as f64)
    } else {
        0.0
    };
    let disks = Disks::new_with_refreshed_list();
    let mut disk_total_bytes: i128 = 0;
    let mut disk_used_bytes: i128 = 0;
    for d in disks.list().iter() {
        let total = d.total_space() as i128;
        let avail = d.available_space() as i128;
        disk_total_bytes += total;
        disk_used_bytes += (total - avail).max(0);
    }
    let gb_div = 1024_i128 * 1024_i128 * 1024_i128;
    let disk_total_gb = (disk_total_bytes / gb_div) as i64;
    let disk_used_gb = (disk_used_bytes / gb_div) as i64;
    let disk_pct = if disk_total_gb > 0 {
        (disk_used_gb as f64) * 100.0 / (disk_total_gb as f64)
    } else {
        0.0
    };

    let cpu_model = Some(
        sys.cpus()
            .iter()
            .map(|c| c.brand().to_string())
            .collect::<Vec<_>>()
            .join(","),
    );
    let cpu_cores = Some(sys.cpus().len() as i32);
    let hardware = HardwareInfo {
        cpu_model,
        cpu_cores,
        cpu_usage_percent: cpu_usage,
        memory_total_mb: total_mb,
        memory_used_mb: used_mb,
        memory_usage_percent: mem_pct,
        disk_total_gb,
        disk_used_gb,
        disk_usage_percent: disk_pct,
    };

    let runtime = RuntimeInfo {
        process_id: Some(std::process::id() as i32),
        process_uptime_seconds: System::uptime() as i64,
        thread_count: Some(0),
    };
    let program_path = std::env::current_exe()
        .ok()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    let environment_obj = {
        let mut map = serde_json::Map::new();
        for (k, v) in std::env::vars() {
            map.insert(k, json!(v));
        }
        serde_json::Value::Object(map)
    };

    let agent_logs_wire: Vec<AgentLogWire> = state
        .logs
        .snapshot_and_clear()
        .into_iter()
        .map(|item| AgentLogWire {
            log_level: normalize_log_level(&item.level),
            message: item.message,
            context: None,
            timestamp: Some(item.ts.to_rfc3339()),
        })
        .collect();

    InstanceReportRequest {
        agent_instance_id: state.cfg.agent_instance_id.clone().unwrap_or_default(),
        application_code: state.cfg.application_code.clone(),
        agent_type: normalize_agent_type(&state.cfg.agent_type),
        agent_version: state.cfg.agent_version.clone(),
        program_path: program_path,
        profiles: None,
        environment: environment_obj,
        system_info: system,
        network_info: network,
        hardware_info: hardware,
        runtime_info: runtime,
        custom_fields: serde_json::json!({}),
        custom_metrics: serde_json::json!({}),
        report_timestamp: Utc::now().to_rfc3339(),
        agent_logs: agent_logs_wire,
    }
}

async fn fetch_public_ip() -> Option<String> {
    let services = ["https://ifconfig.me/ip", "https://icanhazip.com"];
    for s in services.iter() {
        match http_util::get(s.to_string()).await {
            Ok(resp) => {
                if resp.status().is_success() {
                    match resp.text().await {
                        Ok(body) => {
                            let ip = body.trim();
                            if is_valid_public_ipv4(ip) {
                                return Some(ip.to_string());
                            }
                        }
                        Err(e) => {
                            agent_logger::warn(&format!("读取公网IP响应失败: {} - {}", s, e));
                        }
                    }
                } else {
                    agent_logger::warn(&format!(
                        "获取公网IP失败 http={} - {}",
                        resp.status().as_u16(),
                        s
                    ));
                }
            }
            Err(e) => {
                agent_logger::warn(&format!("请求公网IP服务失败: {} - {}", s, e));
            }
        }
    }
    None
}

fn is_valid_public_ipv4(s: &str) -> bool {
    let parts: Vec<&str> = s.split('.').collect();
    if parts.len() != 4 {
        return false;
    }
    let mut octets = [0u8; 4];
    for (i, p) in parts.iter().enumerate() {
        if let Ok(v) = p.parse::<u8>() {
            octets[i] = v;
        } else {
            return false;
        }
    }
    let a = octets[0];
    let b = octets[1];
    if a == 10 {
        return false;
    }
    if a == 127 {
        return false;
    }
    if a == 192 && b == 168 {
        return false;
    }
    if a == 172 && (16..=31).contains(&b) {
        return false;
    }
    if a == 169 && b == 254 {
        return false;
    }
    true
}

/// 格式化操作系统类型为易读字符串
fn format_os(t: Type) -> String {
    match t {
        Type::Windows => "windows".into(),
        Type::Macos => "macos".into(),
        Type::Linux => "linux".into(),
        _ => "unknown".into(),
    }
}

/// 收集本机 IPv4 地址列表
fn local_ips() -> Vec<String> {
    let mut v = Vec::new();
    if let Ok(ips) = local_ip_address::list_afinet_netifas() {
        for (_name, ip) in ips {
            if let std::net::IpAddr::V4(v4) = ip {
                v.push(v4.to_string());
            }
        }
    }
    v
}

/// 尝试获取 MAC 地址（若不可用则返回空）
fn macs() -> Vec<String> {
    match mac_address::get_mac_address() {
        Ok(Some(m)) => vec![m.to_string()],
        _ => vec![],
    }
}

fn pick_primary_ip(ips: &Vec<String>) -> Option<String> {
    // 选取首个非回环 IPv4 地址；否则返回第一个
    for ip in ips {
        if ip != "127.0.0.1" && ip != "::1" && !ip.starts_with("169.254.") {
            return Some(ip.clone());
        }
    }
    ips.get(0).cloned()
}

fn normalize_agent_type(s: &str) -> String {
    // 统一为服务端枚举的 snake_case
    let lower = s.to_ascii_lowercase();
    if lower.replace('-', "_") == "rust_agent" {
        "rust_agent".to_string()
    } else if lower == "java" {
        "java".to_string()
    } else {
        lower.replace('-', "_")
    }
}

fn normalize_log_level(s: &str) -> String {
    match s.to_ascii_lowercase().as_str() {
        "trace" => "trace".to_string(),
        "debug" => "debug".to_string(),
        "info" => "info".to_string(),
        "warn" | "warning" => "warn".to_string(),
        "error" => "error".to_string(),
        "fatal" => "fatal".to_string(),
        other => other.to_string(),
    }
}
