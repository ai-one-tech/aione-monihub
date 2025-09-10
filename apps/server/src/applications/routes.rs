use actix_web::web;
use crate::applications::handlers;

pub fn application_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/api/v1/applications", web::get().to(handlers::get_applications))
        .route("/api/v1/applications", web::post().to(handlers::create_application))
        .route("/api/v1/applications/{id}", web::get().to(handlers::get_application))
        .route("/api/v1/applications/{id}", web::put().to(handlers::update_application))
        .route("/api/v1/applications/{id}", web::delete().to(handlers::delete_application));
}