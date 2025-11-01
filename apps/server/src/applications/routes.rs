use crate::applications::handlers;
use actix_web::web;

pub fn application_routes(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/api/applications",
        web::get().to(handlers::get_applications),
    )
    .route(
        "/api/applications",
        web::post().to(handlers::create_application),
    )
    .route(
        "/api/applications/{id}",
        web::get().to(handlers::get_application),
    )
    .route(
        "/api/applications/{id}",
        web::put().to(handlers::update_application),
    )
    .route(
        "/api/applications/{id}/enable",
        web::post().to(handlers::enable_application),
    )
    .route(
        "/api/applications/{id}/disable",
        web::post().to(handlers::disable_application),
    )
    .route(
        "/api/applications/{id}",
        web::delete().to(handlers::delete_application),
    );
}
