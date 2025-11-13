use crate::{services::AppState, models::{InstanceReportRequest, SystemInfo, NetworkInfo, HardwareInfo, RuntimeInfo}};
use chrono::Utc;
use reqwest::StatusCode;
use tokio::time::{sleep, Duration};
use sysinfo::{SystemExt, CpuExt, DiskExt};
use os_info::Type;
use gethostname::gethostname;

pub async fn start(state: AppState) {
    let interval = state.cfg.report.interval_seconds;
    tokio::spawn(async move {
        loop {
            if !state.http_enabled.load(std::sync::atomic::Ordering::SeqCst) { sleep(Duration::from_secs(interval)).await; continue; }
            let req = build_report(&state);
            let url = format!("{}/api/open/instances/report", state.cfg.server_url);
            let client = reqwest::Client::new();
            let res = client.post(url).json(&req).send().await;
            match res {
                Ok(r) => {
                    if r.status() == StatusCode::FORBIDDEN { state.http_enabled.store(false, std::sync::atomic::Ordering::SeqCst); } else { state.http_enabled.store(true, std::sync::atomic::Ordering::SeqCst); }
                }
                Err(_) => {}
            }
            sleep(Duration::from_secs(interval)).await;
        }
    });
}

fn build_report(state: &AppState) -> InstanceReportRequest {
    let mut sys = sysinfo::System::new_all();
    sys.refresh_all();
    let os = os_info::get();
    let system = SystemInfo { os_type: format_os(os.os_type()), os_version: os.version().to_string(), hostname: gethostname().to_string_lossy().to_string() };
    let network = NetworkInfo { local_ips: local_ips(), mac_addresses: macs(), public_ip: None };
    let total = sys.total_memory() / 1024;
    let used = sys.used_memory() / 1024;
    let hardware = HardwareInfo { cpu: sys.cpus().iter().map(|c| c.brand().to_string()).collect::<Vec<_>>().join(","), total_memory_mb: total, used_memory_mb: used, disks_mb: sys.disks().iter().map(|d| (d.name().to_string_lossy().to_string(), d.total_space()/1024/1024)).collect() };
    let runtime = RuntimeInfo { pid: std::process::id(), uptime_seconds: sys.uptime(), threads: 0, exe_path: std::env::current_exe().ok().map(|p| p.to_string_lossy().to_string()).unwrap_or_default(), env: std::env::vars().collect(), profiles: vec![] };
    InstanceReportRequest { instance_id: state.cfg.instance_id.clone(), system, network, hardware, runtime, custom: serde_json::json!({}), logs: state.logs.snapshot_and_clear(), timestamp: Utc::now() }
}

fn format_os(t: Type) -> String { match t { Type::Windows => "Windows".into(), Type::Macos => "macOS".into(), Type::Linux => "Linux".into(), _ => format!("{:?}", t) } }

fn local_ips() -> Vec<String> { let mut v = Vec::new(); if let Ok(ips) = local_ip_address::list_afinet_netifas() { for (_name, ip) in ips { v.push(ip.to_string()); } } v }

fn macs() -> Vec<String> { match mac_address::get_mac_address() { Ok(Some(m)) => vec![m.to_string()], _ => vec![] } }
