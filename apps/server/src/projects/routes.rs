use crate::projects::handlers;
use actix_web::web;

pub fn project_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/projects", web::get().to(handlers::get_projects))
        .route("/projects", web::post().to(handlers::create_project))
        .route("/projects/{id}", web::get().to(handlers::get_project))
        .route("/projects/{id}", web::put().to(handlers::update_project))
        .route(
            "/projects/{id}/enable",
            web::post().to(handlers::enable_project),
        )
        .route(
            "/projects/{id}/disable",
            web::post().to(handlers::disable_project),
        )
        .route("/projects/{id}", web::delete().to(handlers::delete_project));
}
