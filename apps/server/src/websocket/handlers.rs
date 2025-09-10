use actix_web::{web, HttpRequest, HttpResponse, Error};
use actix_web_actors::ws;
use actix::prelude::*;
use crate::websocket::server::WsSession;
use crate::websocket::server::WsServer;

// WebSocket endpoint handler
pub async fn terminal_websocket(
    req: HttpRequest,
    stream: web::Payload,
    srv: web::Data<Addr<WsServer>>,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let deployment_id = path.into_inner();
    
    // Start WebSocket session
    ws::start(
        WsSession::new(deployment_id, srv.get_ref().clone()),
        &req,
        stream,
    )
}