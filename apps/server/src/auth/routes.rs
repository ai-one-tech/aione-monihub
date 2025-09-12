use actix_web::web;
use crate::auth::handlers;

pub fn auth_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/api/auth/login", web::post().to(handlers::login))
        .route("/api/auth/forgot-password", web::post().to(handlers::forgot_password))
        .route("/api/auth/reset-password", web::post().to(handlers::reset_password));
}