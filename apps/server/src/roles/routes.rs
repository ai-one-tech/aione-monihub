use actix_web::web;
use crate::roles::handlers;

pub fn role_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/api/v1/roles", web::get().to(handlers::get_roles))
        .route("/api/v1/roles", web::post().to(handlers::create_role))
        .route("/api/v1/roles/{id}", web::get().to(handlers::get_role))
        .route("/api/v1/roles/{id}", web::put().to(handlers::update_role))
        .route("/api/v1/roles/{id}", web::delete().to(handlers::delete_role));
}