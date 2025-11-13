use anyhow::Result;
use crate::models::TaskDispatchItem;
use crate::services::AppState;
use walkdir::WalkDir;
use std::fs;
use std::path::PathBuf;
use zip::write::FileOptions;
use std::io::Write;

pub async fn execute(state: &AppState, item: &TaskDispatchItem, _timeout_sec: u64) -> Result<serde_json::Value> {
    let op = item.content.get("operation").and_then(|v| v.as_str()).unwrap_or("");
    if op == "upload_file" { let url = item.content.get("remote_url").and_then(|v| v.as_str()).unwrap_or(""); return upload_file(state, url).await; }
    if op == "download_file" { let path = item.content.get("path").and_then(|v| v.as_str()).unwrap_or(""); return download_file(state, path).await; }
    Err(anyhow::anyhow!("unsupported operation"))
}

async fn upload_file(state: &AppState, remote_url: &str) -> Result<serde_json::Value> {
    let client = reqwest::Client::new();
    let tmp = std::env::temp_dir().join("monihub").join("downloads");
    fs::create_dir_all(&tmp)?;
    let file = tmp.join("remote.tmp");
    let bytes = client.get(remote_url).send().await?.bytes().await?;
    fs::write(&file, &bytes)?;
    let init_url = format!("{}/api/files/upload/init", state.cfg.server_url);
    let init_res = client.post(init_url).json(&serde_json::json!({"filename": "remote.tmp", "size": bytes.len()})).send().await?;
    let meta = init_res.json::<serde_json::Value>().await?;
    let upload_id = meta.get("upload_id").and_then(|v| v.as_str()).unwrap_or("");
    let chunk_url = format!("{}/api/files/upload/chunk", state.cfg.server_url);
    let part = reqwest::multipart::Part::bytes(bytes.to_vec()).file_name("chunk");
    let form = reqwest::multipart::Form::new().text("upload_id", upload_id.to_string()).text("chunk_index", "0").part("chunk", part);
    let _ = client.post(chunk_url).multipart(form).send().await?;
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
    if src.is_file() { let name = src.file_name().unwrap().to_string_lossy().to_string(); let bytes = fs::read(&src)?; w.start_file(name, opt)?; w.write_all(&bytes)?; } else { for e in WalkDir::new(&src).into_iter().filter_map(|e| e.ok()) { let p = e.path(); if p.is_file() { let rel = p.strip_prefix(&src).unwrap().to_string_lossy().to_string(); let bytes = fs::read(p)?; w.start_file(rel, opt)?; w.write_all(&bytes)?; } } }
    w.finish()?;
    let init_url = format!("{}/api/files/upload/init", state.cfg.server_url);
    let client = reqwest::Client::new();
    let size = fs::metadata(&zip_path)?.len();
    let init_res = client.post(init_url).json(&serde_json::json!({"filename": "archive.zip", "size": size})).send().await?;
    let meta = init_res.json::<serde_json::Value>().await?;
    let upload_id = meta.get("upload_id").and_then(|v| v.as_str()).unwrap_or("");
    let chunk_url = format!("{}/api/files/upload/chunk", state.cfg.server_url);
    let bytes = fs::read(&zip_path)?;
    let part = reqwest::multipart::Part::bytes(bytes).file_name("chunk");
    let form = reqwest::multipart::Form::new().text("upload_id", upload_id.to_string()).text("chunk_index", "0").part("chunk", part);
    let _ = client.post(chunk_url).multipart(form).send().await?;
    Ok(serde_json::json!({"upload_id": upload_id}))
}
