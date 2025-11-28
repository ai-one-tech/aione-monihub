use crate::permissions::handlers;
use actix_web::web;

pub fn permission_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/permissions", web::get().to(handlers::get_permissions))
        .route("/permissions", web::post().to(handlers::create_permission))
        .route("/permissions/{id}", web::get().to(handlers::get_permission))
        .route(
            "/permissions/{id}",
            web::put().to(handlers::update_permission),
        )
        .route(
            "/permissions/{id}",
            web::delete().to(handlers::delete_permission),
        )
        .route(
            "/permissions/assign",
            web::post().to(handlers::assign_permissions),
        )
        .route(
            "/permissions/revoke",
            web::post().to(handlers::revoke_permissions),
        )
        .route("/user/menu", web::get().to(handlers::get_user_menu)); // 新增用户菜单接口
}
