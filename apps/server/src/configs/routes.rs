use crate::configs::handlers;
use actix_web::web;

pub fn config_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/configs", web::get().to(handlers::get_configs))
        .route("/configs", web::post().to(handlers::create_config))
        .route(
            "/configs/code/{code}",
            web::get().to(handlers::get_config_by_code),
        )
        .route(
            "/configs/code/{code}/environment/{environment}",
            web::get().to(handlers::get_config_by_code_and_environment),
        )
        .route(
            "/configs/code/{code}/environment/{environment}/version/{version}",
            web::get().to(handlers::get_config_by_code_env_and_version),
        )
        .route(
            "/configs/{id}",
            web::delete().to(handlers::delete_config),
        );
}