use crate::instances::handlers;
use actix_web::web;

pub fn instance_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/instances", web::get().to(handlers::get_instances))
        //.route("/instances", web::post().to(handlers::create_instance))
        .route("/instances/{id}", web::get().to(handlers::get_instance))
        .route(
            "/instances/{id}/config",
            web::put().to(handlers::update_config),
        )
        //.route(
        //    "/instances/{id}",
        //    web::put().to(handlers::update_instance),
        //)
        .route(
            "/instances/{id}/enable",
            web::post().to(handlers::enable_instance),
        )
        .route(
            "/instances/{id}/disable",
            web::post().to(handlers::disable_instance),
        )
        .route(
            "/instances/{id}",
            web::delete().to(handlers::delete_instance),
        )
        .route(
            "/instances/{id}/monitoring-data",
            web::get().to(handlers::get_instance_monitoring_data),
        );
}
