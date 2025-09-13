use crate::roles::handlers;
use actix_web::web;

pub fn role_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/api/roles", web::get().to(handlers::get_roles))
        .route("/api/roles", web::post().to(handlers::create_role))
        .route("/api/roles/{id}", web::get().to(handlers::get_role))
        .route("/api/roles/{id}", web::put().to(handlers::update_role))
        .route("/api/roles/{id}", web::delete().to(handlers::delete_role));
}
