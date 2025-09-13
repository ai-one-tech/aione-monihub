use actix::prelude::Message;
use actix::prelude::Recipient;

// WebSocket message types
#[derive(Message)]
#[rtype(result = "()")]
pub struct WsMessage(pub String);

#[derive(Message)]
#[rtype(result = "()")]
pub struct Connect {
    pub addr: Recipient<WsMessage>,
    pub deployment_id: String,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: String,
    pub deployment_id: String,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct ClientMessage {
    pub id: String,
    pub deployment_id: String,
    pub msg: String,
}
