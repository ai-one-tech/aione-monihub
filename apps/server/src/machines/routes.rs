use actix_web::web;
use crate::machines::handlers;

pub fn machine_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/api/v1/machines", web::get().to(handlers::get_machines))
        .route("/api/v1/machines", web::post().to(handlers::create_machine))
        .route("/api/v1/machines/{id}", web::get().to(handlers::get_machine))
        .route("/api/v1/machines/{id}", web::put().to(handlers::update_machine))
        .route("/api/v1/machines/{id}", web::delete().to(handlers::delete_machine))
        .route("/api/v1/machines/{id}/monitoring-data", web::get().to(handlers::get_machine_monitoring_data));
}