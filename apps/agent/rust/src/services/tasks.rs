use crate::{services::AppState, models::{TaskDispatchResponse, TaskDispatchItem, TaskType, TaskResultSubmitRequest, TaskStatus}};
use chrono::Utc;
use tokio::time::{sleep, Duration};
use tokio::sync::Semaphore;

pub async fn start(state: AppState) {
    let interval = state.cfg.task.poll_interval_seconds;
    let sem = std::sync::Arc::new(Semaphore::new(state.cfg.task.max_concurrent_tasks));
    let st = state.clone();
    tokio::spawn(async move {
        loop {
            if !st.http_enabled.load(std::sync::atomic::Ordering::SeqCst) { sleep(Duration::from_secs(interval)).await; continue; }
            let url = format!("{}/api/open/instances/tasks?agent_instance_id={}", st.cfg.server_url, st.cfg.instance_id);
            let client = reqwest::Client::new();
            let res = client.get(url).send().await;
            if let Ok(resp) = res { if let Ok(body) = resp.json::<TaskDispatchResponse>().await { for item in body.tasks { let permit = sem.clone().acquire_owned().await.unwrap(); let s2 = st.clone(); tokio::spawn(async move { handle_task(s2, item).await; drop(permit); }); } } }
            sleep(Duration::from_secs(interval)).await;
        }
    });
}

async fn handle_task(state: AppState, item: TaskDispatchItem) {
    let start = Utc::now();
    let mut status = TaskStatus::Running;
    let mut code = 0;
    let mut message = String::new();
    let mut data = serde_json::json!({});
    let mut err = None;
    let timeout = item.timeout_seconds.unwrap_or(3600);
    let r = match item.task_type { TaskType::ShellExec => crate::handlers::shell_exec::execute(&item, timeout).await, TaskType::RunCode => crate::handlers::run_code::execute(&item, timeout).await, TaskType::FileManager => crate::handlers::file_manager::execute(&state, &item, timeout).await, TaskType::CustomCommand => crate::handlers::custom_command::execute(&state, &item).await };
    match r { Ok(v) => { status = TaskStatus::Success; data = v; message = String::from("success"); } Err(e) => { status = if message.contains("timeout") { TaskStatus::Timeout } else { TaskStatus::Failed }; code = -1; err = Some(e.to_string()); message = String::from("failed"); } }
    let end = Utc::now();
    let req = TaskResultSubmitRequest { record_id: item.record_id.clone(), instance_id: state.cfg.instance_id.clone(), status, code, message, data, error: err, start_time: start, end_time: end, duration_ms: (end - start).num_milliseconds() as u128 };
    let url = format!("{}/api/open/instances/tasks/result", state.cfg.server_url);
    let client = reqwest::Client::new();
    let _ = client.post(url).json(&req).send().await;
}

