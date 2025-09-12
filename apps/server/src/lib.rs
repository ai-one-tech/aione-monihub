// 导出所有模块
pub mod shared;
pub mod entities;
pub mod migrator;
pub mod auth;
pub mod projects;
pub mod applications;
pub mod deployments;
pub mod users;
pub mod roles;
pub mod permissions;
pub mod logs;
pub mod machines;
pub mod configs;
pub mod websocket;
pub mod health;

// 导出主要的结构体和函数
pub use shared::database::DatabaseManager;
pub use websocket::server::WsServer;