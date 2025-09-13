// 导出所有模块
pub mod applications;
pub mod auth;
pub mod configs;
pub mod deployments;
pub mod entities;
pub mod health;
pub mod logs;
pub mod machines;
// pub mod migrator; // 已使用SQL迁移文件
pub mod permissions;
pub mod projects;
pub mod roles;
pub mod shared;
pub mod users;
pub mod websocket;

// 导出主要的结构体和函数
pub use shared::database::DatabaseManager;
pub use websocket::server::WsServer;
