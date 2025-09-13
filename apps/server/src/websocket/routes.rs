use crate::websocket::handlers;
use actix_web::web;

pub fn websocket_routes(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/api/websocket/terminal/{deployment_id}",
        web::get().to(handlers::terminal_websocket),
    );
}
