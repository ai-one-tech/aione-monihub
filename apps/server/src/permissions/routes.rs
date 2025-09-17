use crate::permissions::handlers;
use actix_web::web;

pub fn permission_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/api/permissions", web::get().to(handlers::get_permissions))
        .route("/api/permissions", web::post().to(handlers::create_permission))
        .route("/api/permissions/{id}", web::get().to(handlers::get_permission))
        .route("/api/permissions/{id}", web::put().to(handlers::update_permission))
        .route("/api/permissions/{id}", web::delete().to(handlers::delete_permission))
        .route(
            "/api/permissions/assign",
            web::post().to(handlers::assign_permissions),
        )
        .route(
            "/api/permissions/revoke",
            web::post().to(handlers::revoke_permissions),
        )
        .route("/api/user/menu", web::get().to(handlers::get_user_menu)); // 新增用户菜单接口
}
