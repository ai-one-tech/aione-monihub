use actix_web::web;
use crate::deployments::handlers;

pub fn deployment_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/api/v1/deployments", web::get().to(handlers::get_deployments))
        .route("/api/v1/deployments", web::post().to(handlers::create_deployment))
        .route("/api/v1/deployments/{id}", web::get().to(handlers::get_deployment))
        .route("/api/v1/deployments/{id}", web::put().to(handlers::update_deployment))
        .route("/api/v1/deployments/{id}", web::delete().to(handlers::delete_deployment))
        .route("/api/v1/deployments/{id}/monitoring", web::get().to(handlers::get_deployment_monitoring))
        // File management endpoints
        .route("/api/v1/deployments/{id}/files", web::get().to(handlers::get_files))
        .route("/api/v1/deployments/{id}/files/upload", web::post().to(handlers::upload_file))
        .route("/api/v1/deployments/{id}/files/{file_path:.*}", web::get().to(handlers::download_file))
        .route("/api/v1/deployments/{id}/files/{file_path:.*}", web::delete().to(handlers::delete_file));
}