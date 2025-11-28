use crate::roles::handlers;
use actix_web::web;

pub fn role_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/roles", web::get().to(handlers::get_roles))
        .route("/roles", web::post().to(handlers::create_role))
        .route("/roles/{id}", web::get().to(handlers::get_role))
        .route("/roles/{id}", web::put().to(handlers::update_role))
        .route("/roles/{id}", web::delete().to(handlers::delete_role))
        .route(
            "/roles/{id}/permissions",
            web::get().to(handlers::get_role_permissions),
        );
}
