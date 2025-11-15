use crate::models::TaskDispatchItem;
use anyhow::Result;
use encoding_rs::GBK;
use std::fs;
#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;
use std::path::PathBuf;
use tokio::process::Command;
use tokio::time::{timeout, Duration};
use uuid::Uuid;

pub async fn execute(item: &TaskDispatchItem, timeout_sec: u64) -> Result<serde_json::Value> {
    let script = item
        .content
        .get("script")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let exec_dir = std::env::current_exe()?
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or(std::env::current_dir()?);
    let task_dir = exec_dir.join("tmp").join("task").join(&item.record_id);
    let workdir_opt = item
        .content
        .get("workdir")
        .and_then(|v| v.as_str())
        .map(|s| s.trim())
        .filter(|s| !s.is_empty());
    let base_dir: PathBuf = if let Some(wd) = workdir_opt {
        PathBuf::from(wd)
    } else {
        task_dir
    };
    fs::create_dir_all(&base_dir)?;
    let ext = if cfg!(target_os = "windows") {
        "bat"
    } else {
        "sh"
    };
    let filename = format!("{}.{}", &item.record_id, ext);
    let script_path = base_dir.join(&filename);
    if cfg!(target_os = "windows") {
        let (bytes, _, _) = GBK.encode(script);
        fs::write(&script_path, bytes.as_ref())?;
    } else {
        fs::write(&script_path, script)?;
        #[cfg(unix)]
        {
            let mut perms = fs::metadata(&script_path)?.permissions();
            perms.set_mode(0o755);
            fs::set_permissions(&script_path, perms)?;
        }
    }

    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd.exe");
        c.arg("/c").arg(script_path.as_os_str());
        c
    } else {
        let mut c = Command::new("sh");
        c.arg(&script_path);
        c
    };
    cmd.current_dir(&base_dir);

    let fut = async move {
        let out = cmd.output().await?;
        let decode = |buf: &[u8]| -> String {
            if cfg!(target_os = "windows") {
                GBK.decode(buf).0.into_owned()
            } else {
                match String::from_utf8(buf.to_vec()) {
                    Ok(txt) => txt,
                    Err(_) => String::from_utf8_lossy(buf).to_string(),
                }
            }
        };
        let stdout_s = decode(&out.stdout);
        let stderr_s = decode(&out.stderr);
        let mut output = if stdout_s.trim().is_empty() {
            stderr_s
        } else {
            stdout_s
        };
        output = output.trim().to_string();
        let _ = fs::remove_file(&script_path);
        Ok(serde_json::json!({"output": output, "status": out.status.code()}))
    };
    let r = timeout(Duration::from_secs(timeout_sec), fut).await;
    r.unwrap_or_else(|_| Err(anyhow::anyhow!("timeout")))
}
