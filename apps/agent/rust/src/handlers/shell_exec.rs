use tokio::process::Command;
use tokio::time::{timeout, Duration};
use anyhow::Result;
use crate::models::TaskDispatchItem;

pub async fn execute(item: &TaskDispatchItem, timeout_sec: u64) -> Result<serde_json::Value> {
    let script = item.content.get("script").and_then(|v| v.as_str()).unwrap_or("");
    let workdir = item.content.get("workdir").and_then(|v| v.as_str());
    let mut cmd = if cfg!(target_os = "windows") { let mut c = Command::new("cmd"); c.arg("/C").arg(script); c } else { let mut c = Command::new("sh"); c.arg("-c").arg(script); c };
    if let Some(wd) = workdir { cmd.current_dir(wd); }
    let fut = async move { let out = cmd.output().await?; let s = String::from_utf8_lossy(&out.stdout).to_string(); Ok(serde_json::json!({"output": s, "status": out.status.code()})) };
    let r = timeout(Duration::from_secs(timeout_sec), fut).await;
    match r { Ok(v) => v, Err(_) => Err(anyhow::anyhow!("timeout")) }
}

