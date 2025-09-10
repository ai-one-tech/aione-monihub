use actix_web::web;
use crate::auth::handlers;

pub fn auth_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/api/v1/auth/login", web::post().to(handlers::login))
        .route("/api/v1/auth/forgot-password", web::post().to(handlers::forgot_password))
        .route("/api/v1/auth/reset-password", web::post().to(handlers::reset_password));
}