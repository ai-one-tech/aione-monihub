use actix_web::web;
use crate::websocket::handlers;

pub fn websocket_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/api/websocket/terminal/{deployment_id}", web::get().to(handlers::terminal_websocket));
}