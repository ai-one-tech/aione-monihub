use crate::deployments::handlers;
use actix_web::web;

pub fn deployment_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/api/deployments", web::get().to(handlers::get_deployments))
        .route(
            "/api/deployments",
            web::post().to(handlers::create_deployment),
        )
        .route(
            "/api/deployments/{id}",
            web::get().to(handlers::get_deployment),
        )
        .route(
            "/api/deployments/{id}",
            web::put().to(handlers::update_deployment),
        )
        .route(
            "/api/deployments/{id}/enable",
            web::post().to(handlers::enable_deployment),
        )
        .route(
            "/api/deployments/{id}/disable",
            web::post().to(handlers::disable_deployment),
        )
        .route(
            "/api/deployments/{id}",
            web::delete().to(handlers::delete_deployment),
        )
        .route(
            "/api/deployments/{id}/monitoring",
            web::get().to(handlers::get_deployment_monitoring),
        )
        // File management endpoints
        .route(
            "/api/deployments/{id}/files",
            web::get().to(handlers::get_files),
        )
        .route(
            "/api/deployments/{id}/files/upload",
            web::post().to(handlers::upload_file),
        )
        .route(
            "/api/deployments/{id}/files/{file_path:.*}",
            web::get().to(handlers::download_file),
        )
        .route(
            "/api/deployments/{id}/files/{file_path:.*}",
            web::delete().to(handlers::delete_file),
        );
}
