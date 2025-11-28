use crate::users::handlers;
use actix_web::web;

pub fn user_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/users", web::get().to(handlers::get_users))
        .route("/users", web::post().to(handlers::create_user))
        .route("/users/{id}", web::get().to(handlers::get_user))
        .route("/users/{id}", web::put().to(handlers::update_user))
        .route("/users/{id}", web::delete().to(handlers::delete_user))
        .route(
            "/users/{id}/disable",
            web::post().to(handlers::disable_user),
        )
        .route("/users/{id}/enable", web::post().to(handlers::enable_user))
        .route(
            "/users/{user_id}/roles",
            web::get().to(handlers::get_user_roles),
        )
        .route(
            "/users/{user_id}/roles",
            web::post().to(handlers::assign_user_roles),
        )
        .route(
            "/users/{user_id}/roles/{role_id}",
            web::delete().to(handlers::remove_user_role),
        );
}
