use crate::users::handlers;
use actix_web::web;

pub fn user_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/api/users", web::get().to(handlers::get_users))
        .route("/api/users", web::post().to(handlers::create_user))
        .route("/api/users/{id}", web::get().to(handlers::get_user))
        .route("/api/users/{id}", web::put().to(handlers::update_user))
        .route("/api/users/{id}", web::delete().to(handlers::delete_user))
        .route(
            "/api/users/{id}/disable",
            web::post().to(handlers::disable_user),
        )
        .route(
            "/api/users/{id}/enable",
            web::post().to(handlers::enable_user),
        );
}
