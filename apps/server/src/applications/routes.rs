use crate::applications::handlers;
use actix_web::web;

pub fn application_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/applications", web::get().to(handlers::get_applications))
        .route(
            "/applications",
            web::post().to(handlers::create_application),
        )
        .route(
            "/applications/{id}",
            web::get().to(handlers::get_application),
        )
        .route(
            "/applications/{id}",
            web::put().to(handlers::update_application),
        )
        .route(
            "/applications/{id}/enable",
            web::post().to(handlers::enable_application),
        )
        .route(
            "/applications/{id}/disable",
            web::post().to(handlers::disable_application),
        )
        .route(
            "/applications/{id}",
            web::delete().to(handlers::delete_application),
        );
}
