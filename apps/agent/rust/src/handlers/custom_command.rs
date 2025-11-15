/// 自定义命令处理器
///
/// 支持命令：DisableHttp / EnableHttp / Shutdown / Restart
/// - Disable/Enable 切换全局 HTTP 可用标志
/// - Shutdown 直接退出进程（容器内建议由编排系统重启）
/// - Restart 返回请求状态，由外部系统决定重启策略
use crate::{agent_logger, models::TaskDispatchItem, services::AppState};
use anyhow::Result;

pub async fn execute(state: &AppState, item: &TaskDispatchItem) -> Result<serde_json::Value> {
    let t = item
        .task_content
        .get("command")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    if t.eq_ignore_ascii_case("DisableHttp") {
        state
            .http_enabled
            .store(false, std::sync::atomic::Ordering::SeqCst);
        agent_logger::warn("收到命令：禁用HTTP");
        return Ok(serde_json::json!({"http":"disabled"}));
    }
    if t.eq_ignore_ascii_case("EnableHttp") {
        state
            .http_enabled
            .store(true, std::sync::atomic::Ordering::SeqCst);
        agent_logger::info("收到命令：启用HTTP");
        return Ok(serde_json::json!({"http":"enabled"}));
    }
    if t.eq_ignore_ascii_case("Shutdown") {
        agent_logger::warn("收到命令：Shutdown");
        std::process::exit(0);
    }
    if t.eq_ignore_ascii_case("Restart") {
        agent_logger::info("收到命令：Restart");
        return Ok(serde_json::json!({"restart":"requested"}));
    }
    Err(anyhow::anyhow!("unknown command"))
}
