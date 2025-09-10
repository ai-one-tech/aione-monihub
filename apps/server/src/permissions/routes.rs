use actix_web::web;
use crate::permissions::handlers;

pub fn permission_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/api/v1/permissions", web::get().to(handlers::get_permissions))
        .route("/api/v1/permissions/assign", web::post().to(handlers::assign_permissions))
        .route("/api/v1/permissions/revoke", web::post().to(handlers::revoke_permissions));
}