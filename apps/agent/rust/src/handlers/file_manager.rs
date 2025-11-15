/// 文件管理处理器
///
/// 支持：
/// - 上传远程 HTTP 文件至服务端（init/resume/chunk，支持断点续传，8MB 分片）
/// - 下载本地文件或目录（自动压缩为 zip）并上传到服务端
/// 任务内容关键字段：operation、remote_url、path 等。
use crate::models::TaskDispatchItem;
use crate::services::AppState;
use crate::utils::http_util;
use anyhow::Result;
use reqwest::Client;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use walkdir::WalkDir;
use zip::write::FileOptions;


pub async fn execute(
    state: &AppState,
    item: &TaskDispatchItem,
    _timeout_sec: u64,
) -> Result<serde_json::Value> {
    let op = item
        .content
        .get("operation")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    if op == "upload_file" {
        let url = item
            .content
            .get("remote_url")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        return upload_file(state, url).await;
    }
    if op == "download_file" {
        let path = item
            .content
            .get("path")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        return download_file(state, path).await;
    }
    Err(anyhow::anyhow!("unsupported operation"))
}

async fn upload_file(state: &AppState, remote_url: &str) -> Result<serde_json::Value> {
    let client = Client::new();
    let tmp = std::env::temp_dir().join("monihub").join("downloads");
    fs::create_dir_all(&tmp)?;
    let file = tmp.join("remote.tmp");
    let bytes = client.get(remote_url).send().await?.bytes().await?;
    fs::write(&file, &bytes)?;

    let name = "remote.tmp";
    let size = bytes.len() as u64;
    let chunk_size: u64 = 8 * 1024 * 1024;
    let total_chunks = (size + chunk_size - 1) / chunk_size;

    let init_url = format!("{}/api/files/upload/init", state.cfg.server_url);
    let init_res = client.post(init_url)
        .json(&serde_json::json!({"file_name": name, "file_size": size, "chunk_size": chunk_size, "total_chunks": total_chunks}))
        .send().await?;
    let meta = init_res.json::<serde_json::Value>().await?;
    let upload_id = meta
        .get("upload_id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    // resume
    let resume_url = format!(
        "{}/api/files/upload/resume?upload_id={}",
        state.cfg.server_url, upload_id
    );
    let mut uploaded: std::collections::HashSet<u64> = std::collections::HashSet::new();
    if let Ok(resume) = client.get(resume_url).send().await {
        if let Ok(val) = resume.json::<serde_json::Value>().await {
            if let Some(arr) = val.get("completed_chunks").and_then(|v| v.as_array()) {
                for i in arr {
                    if let Some(n) = i.as_u64() {
                        uploaded.insert(n);
                    }
                }
            }
        }
    }

    let chunk_url = format!("{}/api/files/upload/chunk", state.cfg.server_url);
    let mut offset: u64 = 0;
    let mut index: u64 = 0;
    while offset < size {
        if uploaded.contains(&index) {
            offset += chunk_size;
            index += 1;
            continue;
        }
        let end = std::cmp::min(offset + chunk_size, size);
        let slice = &bytes[(offset as usize)..(end as usize)];
        let part = reqwest::multipart::Part::bytes(slice.to_vec()).file_name(name.to_string());
        let form = reqwest::multipart::Form::new()
            .text("upload_id", upload_id.clone())
            .text("chunk_index", index.to_string())
            .text("chunk_size", (end - offset).to_string())
            .part("chunk", part);
        let _ = client.post(&chunk_url).multipart(form).send().await?;
        offset = end;
        index += 1;
    }

    Ok(serde_json::json!({"upload_id": upload_id}))
}

async fn download_file(state: &AppState, path: &str) -> Result<serde_json::Value> {
    let src = PathBuf::from(path);
    let tmp = std::env::temp_dir().join("monihub").join("archives");
    fs::create_dir_all(&tmp)?;
    let zip_path = tmp.join("archive.zip");
    let f = fs::File::create(&zip_path)?;
    let mut w = zip::ZipWriter::new(f);
    let opt = FileOptions::default();
    if src.is_file() {
        let name = src.file_name().unwrap().to_string_lossy().to_string();
        let bytes = fs::read(&src)?;
        w.start_file(name, opt)?;
        w.write_all(&bytes)?;
    } else {
        for e in WalkDir::new(&src).into_iter().filter_map(|e| e.ok()) {
            let p = e.path();
            if p.is_file() {
                let rel = p.strip_prefix(&src).unwrap().to_string_lossy().to_string();
                let bytes = fs::read(p)?;
                w.start_file(rel, opt)?;
                w.write_all(&bytes)?;
            }
        }
    }
    w.finish()?;
    let init_url = format!("{}/api/files/upload/init", state.cfg.server_url);
    let size = fs::metadata(&zip_path)?.len();
    let init_res = http_util::post(
        init_url,
        &serde_json::json!({"filename": "archive.zip", "size": size}),
    )
    .await?;
    let meta = init_res.json::<serde_json::Value>().await?;
    let upload_id = meta.get("upload_id").and_then(|v| v.as_str()).unwrap_or("");
    let chunk_url = format!("{}/api/files/upload/chunk", state.cfg.server_url);
    let bytes = fs::read(&zip_path)?;
    let part = reqwest::multipart::Part::bytes(bytes).file_name("chunk");
    let form = reqwest::multipart::Form::new()
        .text("upload_id", upload_id.to_string())
        .text("chunk_index", "0")
        .part("chunk", part);
    let _ = http_util::get_client()
        .post(chunk_url)
        .multipart(form)
        .send()
        .await?;
    Ok(serde_json::json!({"upload_id": upload_id}))
}
