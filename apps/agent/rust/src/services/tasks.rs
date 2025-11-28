use crate::utils::http_util;
/// 任务拉取与执行服务
///
/// 使用长轮询从服务端拉取任务（支持 wait/timeout），并发执行各类任务，
/// 将执行结果回传后端。403 时通过全局标志暂停轮询并轻量退避。
use crate::{
    agent_logger,
    models::{
        TaskDispatchItem, TaskDispatchResponse, TaskResultSubmitRequest, TaskStatus, TaskType,
    },
    services::AppState,
};
use chrono::Utc;
use reqwest::Client;
use tokio::sync::Semaphore;
use tokio::time::{sleep, Duration};

pub async fn start(state: AppState) {
    let sem = std::sync::Arc::new(Semaphore::new(state.cfg.task.max_concurrent_tasks));
    let st = state.clone();
    tokio::spawn(async move {
        let _client = Client::builder()
            .timeout(Duration::from_secs(
                st.cfg.task.long_poll_timeout_seconds + 5,
            ))
            .build()
            .unwrap();
        loop {
            if !st.cfg.task.enabled {
                sleep(Duration::from_secs(2)).await;
                continue;
            }

            let url = format!(
                "{}/api/open/instances/tasks?agent_instance_id={}&wait=true&timeout={}",
                st.cfg.server_url,
                st.cfg.agent_instance_id.clone().unwrap_or_default(),
                st.cfg.task.long_poll_timeout_seconds
            );

            match http_util::get(url).await {
                Ok(resp) => {
                    let content = resp.text().await.unwrap();
                    match serde_json::from_str::<TaskDispatchResponse>(&content) {
                        Ok(body) => {
                            agent_logger::info(&format!("拉取到任务数量: {}", body.tasks.len()));
                            for item in body.tasks {
                                let permit = sem.clone().acquire_owned().await.unwrap();
                                let s2 = st.clone();
                                tokio::spawn(async move {
                                    handle_task(s2, item).await;
                                    drop(permit);
                                });
                            }
                        }
                        Err(e) => {}
                    }
                }
                Err(e) => {
                    // 非超时错误轻微退避
                    sleep(Duration::from_millis(800)).await;
                }
            }
        }
    });
}

/// 处理单个任务：执行并构造结果请求回传
async fn handle_task(state: AppState, item: TaskDispatchItem) {
    let start = Utc::now();
    let task_type_str = match item.task_type {
        TaskType::ShellExec => "shell_exec",
        TaskType::RunCode => "run_code",
        TaskType::FileManager => "file_manager",
        TaskType::CustomCommand => "custom_command",
        TaskType::HttpRequest => "http_request",
    };
    agent_logger::info(&format!(
        "开始执行任务 record_id={} type={}",
        item.record_id, task_type_str
    ));
    let status: TaskStatus;
    let mut code = 0;
    let mut message = String::new();
    let mut data = serde_json::json!({});
    let mut err = None;
    let timeout = item.timeout_seconds.clone();
    let r = match item.task_type {
        TaskType::ShellExec => crate::handlers::shell_exec::execute(&item, timeout).await,
        TaskType::RunCode => crate::handlers::run_code::execute(&item, timeout).await,
        TaskType::FileManager => {
            crate::handlers::file_manager::execute(&state, &item, timeout).await
        }
        TaskType::CustomCommand => crate::handlers::custom_command::execute(&state, &item).await,
        TaskType::HttpRequest => {
            crate::handlers::http_request::execute(&state, &item, timeout).await
        }
    };
    match r {
        Ok(v) => {
            status = TaskStatus::Success;
            data = v;
            agent_logger::info(&format!("任务成功 record_id={}", item.record_id));
        }
        Err(e) => {
            status = if message.contains("timeout") {
                TaskStatus::Timeout
            } else {
                TaskStatus::Failed
            };
            code = -1;
            err = Some(e.to_string());
            message = String::from("failed");
            agent_logger::error(&format!(
                "任务失败 record_id={} error={}",
                item.record_id, e
            ));
        }
    }
    let end = Utc::now();
    let req = TaskResultSubmitRequest {
        record_id: item.record_id.clone(),
        instance_id: state.cfg.instance_id.clone().unwrap_or_default(),
        status,
        code,
        message,
        data,
        error: err,
        start_time: start,
        end_time: end,
        duration_ms: (end - start).num_milliseconds() as u128,
    };
    let url = format!("{}/api/open/instances/tasks/result", state.cfg.server_url);
    let client = reqwest::Client::new();
    let _ = client.post(url).json(&req).send().await;
}
