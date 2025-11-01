use crate::instances::handlers;
use actix_web::web;

pub fn instance_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/api/instances", web::get().to(handlers::get_instances))
        .route("/api/instances", web::post().to(handlers::create_instance))
        .route("/api/instances/{id}", web::get().to(handlers::get_instance))
        .route(
            "/api/instances/{id}",
            web::put().to(handlers::update_instance),
        )
        .route(
            "/api/instances/{id}/enable",
            web::post().to(handlers::enable_instance),
        )
        .route(
            "/api/instances/{id}/disable",
            web::post().to(handlers::disable_instance),
        )
        .route(
            "/api/instances/{id}",
            web::delete().to(handlers::delete_instance),
        )
        .route(
            "/api/instances/{id}/monitoring-data",
            web::get().to(handlers::get_instance_monitoring_data),
        );
}
