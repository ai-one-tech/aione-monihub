/// HTTP 请求处理器
///
/// 支持多种请求体：json/form/raw/multipart；可配置重定向策略与 TLS 验证。
/// 任务内容关键字段：method、url、allow_redirects、verify_tls、headers、query、body_type 等。
use crate::{models::TaskDispatchItem, services::AppState};
use anyhow::Result;
use reqwest::Method;
use serde_json::Value;
use std::time::Duration;

pub async fn execute(state: &AppState, item: &TaskDispatchItem, timeout_sec: u64) -> Result<Value> {
    let method = item
        .task_content
        .get("method")
        .and_then(|v| v.as_str())
        .unwrap_or("GET");
    let url = item
        .task_content
        .get("url")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    if url.is_empty() {
        return Err(anyhow::anyhow!("invalid url"));
    }
    let allow_redirects = item
        .task_content
        .get("allow_redirects")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let verify_tls = item
        .task_content
        .get("verify_tls")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    let headers = item.task_content.get("headers").and_then(|v| v.as_object());
    let query = item.task_content.get("query").and_then(|v| v.as_object());
    let body_type = item
        .task_content
        .get("body_type")
        .and_then(|v| v.as_str())
        .unwrap_or("none")
        .to_string();
    let mut builder = reqwest::Client::builder().timeout(Duration::from_secs(timeout_sec));
    if !verify_tls {
        builder = builder.danger_accept_invalid_certs(true);
    }
    if state.cfg.http.proxy_enabled {
        if let Some(proxy) = &state.cfg.http.proxy_url {
            if !proxy.is_empty() {
                if let Ok(pp) = reqwest::Proxy::all(proxy) {
                    builder = builder.proxy(pp);
                }
            }
        }
    }
    let client = builder
        .redirect(if allow_redirects {
            reqwest::redirect::Policy::limited(10)
        } else {
            reqwest::redirect::Policy::none()
        })
        .build()?;
    let m = match method.to_uppercase().as_str() {
        "GET" => Method::GET,
        "POST" => Method::POST,
        "PUT" => Method::PUT,
        "DELETE" => Method::DELETE,
        "PATCH" => Method::PATCH,
        "HEAD" => Method::HEAD,
        "OPTIONS" => Method::OPTIONS,
        _ => Method::GET,
    };
    let mut req = client.request(m, url);
    if let Some(hs) = headers {
        for (k, v) in hs {
            if let Some(s) = v.as_str() {
                req = req.header(k, s);
            } else {
                req = req.header(k, v.to_string());
            }
        }
    }
    if let Some(q) = query {
        let mut qp = Vec::new();
        for (k, v) in q {
            if v.is_string() {
                qp.push((k.clone(), v.as_str().unwrap().to_string()));
            } else {
                qp.push((k.clone(), v.to_string()));
            }
        }
        req = req.query(&qp);
    }
    match body_type.as_str() {
        "json" => {
            if let Some(b) = item.task_content.get("json_body") {
                req = req.json(b);
            }
        }
        "form" => {
            if let Some(f) = item.task_content.get("form_fields").and_then(|v| v.as_object()) {
                let mut form = vec![];
                for (k, v) in f {
                    form.push((k.clone(), v.as_str().unwrap_or(&v.to_string()).to_string()));
                }
                req = req.form(&form);
            }
        }
        "raw" => {
            let ct = item
                .task_content
                .get("content_type")
                .and_then(|v| v.as_str())
                .unwrap_or("text/plain");
            let body = item
                .task_content
                .get("raw_body")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            req = req.body(body.to_string()).header("Content-Type", ct);
        }
        "multipart" => {
            if let Some(parts) = item.task_content.get("parts").and_then(|v| v.as_array()) {
                let mut mp = reqwest::multipart::Form::new();
                for p in parts {
                    let t = p.get("type").and_then(|v| v.as_str()).unwrap_or("field");
                    let name = p.get("name").and_then(|v| v.as_str()).unwrap_or("");
                    if name.is_empty() {
                        continue;
                    }
                    if t == "file" {
                        let fp = p.get("file_path").and_then(|v| v.as_str()).unwrap_or("");
                        if fp.is_empty() {
                            continue;
                        }
                        let filename = p.get("filename").and_then(|v| v.as_str());
                        let mut part = if let Ok(bytes) = std::fs::read(fp) {
                            reqwest::multipart::Part::bytes(bytes)
                        } else {
                            continue;
                        };
                        if let Some(fnv) = filename {
                            part = part.file_name(fnv.to_string());
                        }
                        mp = mp.part(name.to_string(), part);
                    } else {
                        let val = p.get("value").and_then(|v| v.as_str()).unwrap_or("");
                        mp = mp.text(name.to_string(), val.to_string());
                    }
                }
                req = req.multipart(mp);
            }
        }
        _ => {}
    }
    let start = std::time::Instant::now();
    let resp = req.send().await?;
    let status = resp.status().as_u16();
    let mut h = serde_json::Map::new();
    for (k, v) in resp.headers().iter() {
        h.insert(
            k.to_string(),
            Value::String(v.to_str().unwrap_or("").to_string()),
        );
    }
    let mut body_str = String::new();
    if let Ok(bytes) = resp.bytes().await {
        let max = 5 * 1024 * 1024;
        if bytes.len() > max {
            body_str = String::from_utf8_lossy(&bytes[..max]).to_string();
        } else {
            body_str = String::from_utf8_lossy(&bytes).to_string();
        }
    }
    let elapsed = start.elapsed().as_millis() as u64;
    Ok(serde_json::json!({"status": status, "headers": h, "body": body_str, "elapsed_ms": elapsed}))
}
