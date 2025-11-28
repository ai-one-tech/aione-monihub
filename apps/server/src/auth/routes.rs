use crate::auth::handlers;
use actix_web::web;

pub fn auth_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/auth/login", web::post().to(handlers::login))
        .route(
            "/auth/forgot-password",
            web::post().to(handlers::forgot_password),
        )
        .route(
            "/auth/reset-password",
            web::post().to(handlers::reset_password),
        )
        .route("/auth/validate", web::get().to(handlers::validate_token))
        .route("/auth/me", web::get().to(handlers::get_current_user));
}
