use crate::websocket::models::{ClientMessage, Connect, Disconnect, WsMessage};
use crate::shared::snowflake::generate_snowflake_id;
use actix::prelude::*;
use actix_web_actors::ws;
use std::time::{Duration, Instant};

// WebSocket session
pub struct WsSession {
    id: String,
    deployment_id: String,
    heartbeat: Instant,
    addr: Addr<WsServer>,
}

impl WsSession {
    pub fn new(deployment_id: String, addr: Addr<WsServer>) -> Self {
        Self {
            id: generate_snowflake_id(),
            deployment_id,
            heartbeat: Instant::now(),
            addr,
        }
    }
}

impl Actor for WsSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        // Start heartbeat
        self.heartbeat(ctx);

        // Register with server
        let addr = ctx.address();
        self.addr.do_send(Connect {
            addr: addr.recipient(),
            deployment_id: self.deployment_id.clone(),
        });
    }

    fn stopped(&mut self, _: &mut Self::Context) {
        // Unregister from server
        self.addr.do_send(Disconnect {
            id: self.id.clone(),
            deployment_id: self.deployment_id.clone(),
        });
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsSession {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => {
                self.heartbeat = Instant::now();
                ctx.pong(&msg);
            }
            Ok(ws::Message::Pong(_)) => {
                self.heartbeat = Instant::now();
            }
            Ok(ws::Message::Text(text)) => {
                // Forward message to server
                self.addr.do_send(ClientMessage {
                    id: self.id.clone(),
                    deployment_id: self.deployment_id.clone(),
                    msg: text.to_string(), // 修复类型错误，确保是String类型
                });
            }
            Ok(ws::Message::Binary(bin)) => ctx.binary(bin),
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => ctx.stop(),
        }
    }
}

impl Handler<WsMessage> for WsSession {
    type Result = ();

    fn handle(&mut self, msg: WsMessage, ctx: &mut Self::Context) {
        ctx.text(msg.0);
    }
}

impl WsSession {
    fn heartbeat(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(Duration::from_secs(5), |act, ctx| {
            if Instant::now().duration_since(act.heartbeat) > Duration::from_secs(10) {
                ctx.stop();
                return;
            }

            ctx.ping(b"");
        });
    }
}

// WebSocket server
pub struct WsServer {
    sessions:
        std::collections::HashMap<String, std::collections::HashMap<String, Recipient<WsMessage>>>,
}

impl WsServer {
    pub fn new() -> Self {
        Self {
            sessions: std::collections::HashMap::new(),
        }
    }
}

impl Default for WsServer {
    fn default() -> Self {
        Self::new()
    }
}

impl Actor for WsServer {
    type Context = Context<Self>;
}

impl Handler<Connect> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: Connect, _: &mut Context<Self>) {
        // Add session to deployment group
        self.sessions
            .entry(msg.deployment_id.clone())
            .or_insert_with(std::collections::HashMap::new)
            .insert(generate_snowflake_id(), msg.addr);
    }
}

impl Handler<Disconnect> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, _: &mut Context<Self>) {
        // Remove session from deployment group
        if let Some(deployment_sessions) = self.sessions.get_mut(&msg.deployment_id) {
            deployment_sessions.remove(&msg.id);
        }
    }
}

impl Handler<ClientMessage> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: ClientMessage, _: &mut Context<Self>) {
        // Echo message back to client (in a real implementation, this would process the command)
        if let Some(deployment_sessions) = self.sessions.get(&msg.deployment_id) {
            if let Some(addr) = deployment_sessions.get(&msg.id) {
                let response = format!("Received: {}", msg.msg);
                addr.do_send(WsMessage(response));
            }
        }
    }
}
