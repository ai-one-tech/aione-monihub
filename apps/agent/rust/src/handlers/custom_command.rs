use anyhow::Result;
use crate::{services::AppState, models::TaskDispatchItem};

pub async fn execute(state: &AppState, item: &TaskDispatchItem) -> Result<serde_json::Value> {
    let t = item.content.get("command").and_then(|v| v.as_str()).unwrap_or("");
    if t.eq_ignore_ascii_case("DisableHttp") { state.http_enabled.store(false, std::sync::atomic::Ordering::SeqCst); return Ok(serde_json::json!({"http":"disabled"})); }
    if t.eq_ignore_ascii_case("EnableHttp") { state.http_enabled.store(true, std::sync::atomic::Ordering::SeqCst); return Ok(serde_json::json!({"http":"enabled"})); }
    if t.eq_ignore_ascii_case("Shutdown") { std::process::exit(0); }
    if t.eq_ignore_ascii_case("Restart") { return Ok(serde_json::json!({"restart":"requested"})); }
    Err(anyhow::anyhow!("unknown command"))
}

