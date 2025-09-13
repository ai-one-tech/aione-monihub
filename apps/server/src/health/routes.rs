use crate::health::handlers;
use actix_web::web;

pub fn health_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/health", web::get().to(handlers::health));
}
