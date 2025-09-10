use actix_web::web;
use crate::users::handlers;

pub fn user_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/api/v1/users", web::get().to(handlers::get_users))
        .route("/api/v1/users", web::post().to(handlers::create_user))
        .route("/api/v1/users/{id}", web::get().to(handlers::get_user))
        .route("/api/v1/users/{id}", web::put().to(handlers::update_user))
        .route("/api/v1/users/{id}", web::delete().to(handlers::delete_user))
        .route("/api/v1/users/{id}/disable", web::post().to(handlers::disable_user))
        .route("/api/v1/users/{id}/enable", web::post().to(handlers::enable_user));
}