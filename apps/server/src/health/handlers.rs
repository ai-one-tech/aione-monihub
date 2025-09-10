use actix_web::{HttpResponse, Result};

pub async fn health() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json("Server is running"))
}