use crate::logs::handlers;
use actix_web::web;

pub fn log_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/api/v1/logs", web::get().to(handlers::get_logs))
        .route("/api/v1/logs/export", web::get().to(handlers::export_logs));
}
