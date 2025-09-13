use crate::auth::handlers;
use actix_web::web;

pub fn auth_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/api/auth/login", web::post().to(handlers::login))
        .route(
            "/api/auth/forgot-password",
            web::post().to(handlers::forgot_password),
        )
        .route(
            "/api/auth/reset-password",
            web::post().to(handlers::reset_password),
        )
        .route(
            "/api/auth/validate",
            web::get().to(handlers::validate_token),
        )
        .route("/api/auth/me", web::get().to(handlers::get_current_user));
}
