use reqwest::{Error, Response};
use serde::Serialize;

pub fn get_client() -> reqwest::Client{
    let client = reqwest::Client::new();
    // let client = match reqwest::Proxy::all("http://127.0.0.1:9000") {
    //     Ok(p) => reqwest::Client::builder()
    //         .proxy(p)
    //         .build()
    //         .unwrap_or_else(|e| {
    //             agent_logger::warn(&format!("初始化HTTP客户端失败: {}", e));
    //             reqwest::Client::new()
    //         }),
    //     Err(e) => {
    //         agent_logger::warn(&format!("初始化代理失败: {}", e));
    //         reqwest::Client::new()
    //     }
    // };
    client
}

pub async fn post<T: Serialize + ?Sized>(url: String, json: &T) -> Result<Response, Error> {
    get_client().post(url).json(json).send().await
}

pub(crate) async fn get(url: String) -> Result<Response, Error> {
    get_client().get(url).send().await
}