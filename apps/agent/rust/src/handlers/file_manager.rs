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
use log::info;
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
        .task_content
        .get("operation")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    if op == "upload_file" {
        let url = item
            .task_content
            .get("remote_url")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let path = item
            .task_content
            .get("path")
            .or(item.task_content.get("target_path"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        return upload_file(state, url, path).await;
    }
    if op == "download_file" {
        let path = item
            .task_content
            .get("path")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        return download_file(state, item, path).await;
    }
    Err(anyhow::anyhow!("unsupported operation"))
}

async fn upload_file(
    state: &AppState,
    remote_url: &str,
    target_path: Option<String>,
) -> Result<serde_json::Value> {
    let client = Client::new();

    // 如果指定了目标路径，直接保存到本地（下载模式）
    if let Some(path) = target_path {
        info!("Downloading file from {} to {}", remote_url, path);
        let mut path_buf = PathBuf::from(&path);

        // 如果路径以分隔符结尾，或者是已存在的目录，则追加文件名
        if path.ends_with('/') || path.ends_with('\\') || path_buf.is_dir() {
            let filename = remote_url
                .split('/')
                .last()
                .filter(|s| !s.is_empty())
                .unwrap_or("downloaded_file");
            path_buf = path_buf.join(filename);
        }

        if let Some(parent) = path_buf.parent() {
            fs::create_dir_all(parent)?;
        }

        // 使用 .part 临时文件，避免下载中断导致文件损坏
        let part_path = PathBuf::from(format!("{}.part", path_buf.to_string_lossy()));

        let mut response = client.get(remote_url).send().await?;
        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Download failed with status: {}",
                response.status()
            ));
        }

        let mut file = fs::File::create(&part_path)?;
        let mut downloaded: u64 = 0;

        while let Some(chunk) = response.chunk().await? {
            file.write_all(&chunk)?;
            downloaded += chunk.len() as u64;
        }

        fs::rename(&part_path, &path_buf)?;

        info!(
            "Download completed: {} bytes saved to {:?}",
            downloaded, path_buf
        );

        return Ok(serde_json::json!({
            "status": "success",
            "saved_path": path_buf.to_string_lossy(),
            "size": downloaded
        }));
    }

    // 否则执行原有的“下载并上传到服务端”逻辑
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

async fn download_file(
    state: &AppState,
    item: &TaskDispatchItem,
    path: &str,
) -> Result<serde_json::Value> {
    let src = PathBuf::from(path);
    if !src.exists() {
        return Err(anyhow::anyhow!("File or directory not found: {}", path));
    }

    let is_directory = src.is_dir();
    let original_name = src
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "file".to_string());

    let is_zip: bool;
    let target_file: PathBuf;
    let final_name: String;

    if is_directory {
        is_zip = true;
        final_name = format!("{}.zip", original_name);
        target_file = std::env::temp_dir()
            .join("monihub")
            .join("archives")
            .join(&final_name);
        fs::create_dir_all(target_file.parent().unwrap())?;

        zip_directory(&src, &target_file)?;
    } else {
        let file_size = fs::metadata(&src)?.len();
        let is_compressed_file = is_compressed_extension(&original_name);

        let max_size = 10 * 1024 * 1024;
        if file_size > max_size && !is_compressed_file {
            is_zip = true;
            final_name = format!("{}.zip", original_name);
            target_file = std::env::temp_dir()
                .join("monihub")
                .join("archives")
                .join(&final_name);
            fs::create_dir_all(target_file.parent().unwrap())?;

            zip_single_file(&src, &target_file)?;
        } else {
            is_zip = false;
            final_name = original_name.clone();
            target_file = src.clone();
        }
    }

    let file_size = fs::metadata(&target_file)?.len();

    let chunk_size: u64 = 8 * 1024 * 1024;
    let total_chunks = (file_size + chunk_size - 1) / chunk_size;

    let init_url = format!("{}/api/files/upload/init", state.cfg.server_url);

    let file_extension = if is_zip {
        Some("zip".to_string())
    } else {
        original_name.rsplit('.').next().map(|s| s.to_string())
    };

    // 参考 Java 实现,从 task 中获取 task_id 和 instance_id
    let init_body = serde_json::json!({
        "file_name": final_name,
        "file_size": file_size,
        "chunk_size": chunk_size,
        "total_chunks": total_chunks,
        "is_zip": is_zip,
        "task_id": item.task_id,
        "instance_id": item.instance_id,
        "file_extension": file_extension,
        "original_file_path": path,
        "is_directory": is_directory
    });

    let init_res = http_util::post(init_url, &init_body).await?;
    let meta = init_res.json::<serde_json::Value>().await?;

    // 提取 upload_id (必需字段)
    let upload_id = meta
        .get("upload_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            anyhow::anyhow!(
                "Missing upload_id in init response. Response: {}",
                serde_json::to_string_pretty(&meta).unwrap_or_else(|_| format!("{:?}", meta))
            )
        })?
        .to_string();

    // 提取可选字段 (参考 Java FileManagerHandler 实现)
    let init_download_path = meta
        .get("download_path")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let init_is_directory = meta.get("is_directory").and_then(|v| v.as_bool());

    let init_compressed = meta.get("compressed").and_then(|v| v.as_bool());

    let init_final_name = meta
        .get("final_name")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let init_size = meta.get("size").and_then(|v| v.as_u64());

    let init_server_file_path = meta
        .get("server_file_path")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let resume_url = format!(
        "{}/api/files/upload/resume?upload_id={}",
        state.cfg.server_url, upload_id
    );

    let mut uploaded_chunks: std::collections::HashSet<u64> = std::collections::HashSet::new();
    if let Ok(resume_res) = http_util::get_client().get(&resume_url).send().await {
        if let Ok(resume_data) = resume_res.json::<serde_json::Value>().await {
            if let Some(arr) = resume_data
                .get("completed_chunks")
                .and_then(|v| v.as_array())
            {
                for chunk_idx in arr {
                    if let Some(n) = chunk_idx.as_u64() {
                        uploaded_chunks.insert(n);
                    }
                }
            }
        }
    }

    let file_bytes = fs::read(&target_file)?;
    let chunk_url = format!("{}/api/files/upload/chunk", state.cfg.server_url);

    let max_retries = 3;
    let min_chunk_size: u64 = 1 * 1024 * 1024;
    let mut current_chunk_size = chunk_size;
    let mut chunk_index: u64 = 0;
    let mut offset: u64 = 0;

    while offset < file_size {
        if uploaded_chunks.contains(&chunk_index) {
            let skip_size = std::cmp::min(chunk_size, file_size - offset);
            offset += skip_size;
            chunk_index += 1;
            continue;
        }

        let end = std::cmp::min(offset + current_chunk_size, file_size);
        let chunk_data = &file_bytes[(offset as usize)..(end as usize)];

        let mut retry_count = 0;
        let mut upload_success = false;
        let mut consecutive_failures = 0;

        while retry_count <= max_retries && !upload_success {
            let part =
                reqwest::multipart::Part::bytes(chunk_data.to_vec()).file_name(final_name.clone());
            let form = reqwest::multipart::Form::new()
                .text("upload_id", upload_id.clone())
                .text("chunk_index", chunk_index.to_string())
                .text("chunk_size", (end - offset).to_string())
                .part("chunk", part);

            match http_util::get_client()
                .post(&chunk_url)
                .multipart(form)
                .send()
                .await
            {
                Ok(res) => {
                    let status = res.status();
                    if status.is_success() {
                        upload_success = true;
                        consecutive_failures = 0;
                        info!("Chunk {} uploaded successfully", chunk_index);
                    } else if status.as_u16() == 413 {
                        consecutive_failures += 1;
                        if current_chunk_size > min_chunk_size && consecutive_failures > 1 {
                            let new_chunk_size =
                                std::cmp::max(min_chunk_size, current_chunk_size / 2);
                            if new_chunk_size < current_chunk_size {
                                current_chunk_size = new_chunk_size;
                                info!(
                                    "Reducing chunk size to {} due to 413 error",
                                    current_chunk_size
                                );
                                continue;
                            }
                        }
                        retry_count += 1;
                    } else {
                        consecutive_failures += 1;
                        retry_count += 1;
                    }
                }
                Err(e) => {
                    consecutive_failures += 1;
                    retry_count += 1;
                    if retry_count <= max_retries {
                        info!(
                            "Chunk {} upload failed (attempt {}): {}",
                            chunk_index, retry_count, e
                        );
                        tokio::time::sleep(tokio::time::Duration::from_secs(retry_count as u64))
                            .await;
                    }
                }
            }
        }

        if !upload_success {
            return Err(anyhow::anyhow!(
                "Failed to upload chunk {} after {} retries",
                chunk_index,
                max_retries
            ));
        }

        offset = end;
        chunk_index += 1;
    }

    let file_id = upload_id.clone();
    let download_url = if let Some(path) = init_download_path {
        format!("{}{}", state.cfg.server_url, path)
    } else {
        format!("{}/api/files/download/{}", state.cfg.server_url, file_id)
    };

    // 参考 Java 实现,优先使用 init 响应中的值,否则使用本地计算的值
    Ok(serde_json::json!({
        "download_url": download_url,
        "file_record_id": file_id,
        "is_directory": init_is_directory.unwrap_or(is_directory),
        "compressed": init_compressed.unwrap_or(is_zip),
        "final_name": init_final_name.unwrap_or_else(|| final_name.clone()),
        "size": init_size.unwrap_or(file_size),
        "server_file_path": init_server_file_path.unwrap_or_else(|| format!("/uploads/{}", final_name))
    }))
}

fn is_compressed_extension(filename: &str) -> bool {
    let lower = filename.to_lowercase();
    let compressed_exts = [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz"];
    compressed_exts.iter().any(|ext| lower.ends_with(ext))
}

fn zip_single_file(src: &PathBuf, dest: &PathBuf) -> Result<()> {
    let file = fs::File::create(dest)?;
    let mut zip_writer = zip::ZipWriter::new(file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    let file_name = src
        .file_name()
        .ok_or_else(|| anyhow::anyhow!("Invalid file name"))?
        .to_string_lossy()
        .to_string();

    zip_writer.start_file(file_name, options)?;
    let content = fs::read(src)?;
    zip_writer.write_all(&content)?;
    zip_writer.finish()?;

    Ok(())
}

fn zip_directory(src: &PathBuf, dest: &PathBuf) -> Result<()> {
    let file = fs::File::create(dest)?;
    let mut zip_writer = zip::ZipWriter::new(file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    let walkdir = WalkDir::new(src);
    let base_path = src;

    for entry in walkdir.into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        let name = path
            .strip_prefix(base_path)
            .map_err(|e| anyhow::anyhow!("Strip prefix error: {}", e))?;

        if path.is_file() {
            let relative_path = name.to_string_lossy().to_string();
            zip_writer.start_file(relative_path, options)?;
            let content = fs::read(path)?;
            zip_writer.write_all(&content)?;
        } else if !name.as_os_str().is_empty() {
            let relative_path = format!("{}/", name.to_string_lossy());
            zip_writer.add_directory(relative_path, options)?;
        }
    }

    zip_writer.finish()?;
    Ok(())
}
