use actix_web::web;
use crate::health::handlers;

pub fn health_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/health", web::get().to(handlers::health));
}