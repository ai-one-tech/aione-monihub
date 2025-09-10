use actix_web::{HttpResponse, Result};
use utoipa::ToSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, ToSchema)]
pub struct HealthResponse {
    pub status: String,
    pub message: String,
}

/// 健康检查接口
/// 
/// 检查服务器运行状态
#[utoipa::path(
    get,
    path = "/health",
    tag = "health",
    responses(
        (status = 200, description = "服务器运行正常", body = HealthResponse)
    )
)]
pub async fn health() -> Result<HttpResponse> {
    let response = HealthResponse {
        status: "ok".to_string(),
        message: "Server is running".to_string(),
    };
    Ok(HttpResponse::Ok().json(response))
}