use crate::projects::handlers;
use actix_web::web;

pub fn project_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/api/projects", web::get().to(handlers::get_projects))
        .route("/api/projects", web::post().to(handlers::create_project))
        .route("/api/projects/{id}", web::get().to(handlers::get_project))
        .route(
            "/api/projects/{id}",
            web::put().to(handlers::update_project),
        )
        .route(
            "/api/projects/{id}",
            web::delete().to(handlers::delete_project),
        );
}
