use crate::logs::handlers;
use actix_web::web;

pub fn log_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/logs", web::get().to(handlers::get_logs))
        .route("/logs/export", web::get().to(handlers::export_logs));
}
