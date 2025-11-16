use actix_web::web;
use crate::audit::handlers;

pub fn audit_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/audit")
            .route("/logs", web::get().to(handlers::get_audit_logs))
            .route("/logs/{id}", web::get().to(handlers::get_audit_log_detail))
    );
}