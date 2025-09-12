use actix_web::web;
use crate::configs::handlers;

pub fn config_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/api/configs", web::get().to(handlers::get_configs))
        .route("/api/configs", web::post().to(handlers::create_config))
        .route("/api/configs/code/{code}", web::get().to(handlers::get_config_by_code))
        .route("/api/configs/code/{code}/environment/{environment}", web::get().to(handlers::get_config_by_code_and_environment))
        .route("/api/configs/code/{code}/environment/{environment}/version/{version}", web::get().to(handlers::get_config_by_code_env_and_version))
        .route("/api/configs/{id}", web::delete().to(handlers::delete_config));
}