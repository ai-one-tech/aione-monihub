use actix_web::web;
use crate::projects::handlers;

pub fn project_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/api/v1/projects", web::get().to(handlers::get_projects))
        .route("/api/v1/projects", web::post().to(handlers::create_project))
        .route("/api/v1/projects/{id}", web::get().to(handlers::get_project))
        .route("/api/v1/projects/{id}", web::put().to(handlers::update_project))
        .route("/api/v1/projects/{id}", web::delete().to(handlers::delete_project));
}