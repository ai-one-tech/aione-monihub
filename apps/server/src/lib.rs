// 导出所有模块
pub mod applications;
pub mod auth;
pub mod configs;
pub mod entities;
pub mod files;
pub mod health;
pub mod instance_reports;
pub mod instance_tasks;
pub mod logs;
pub mod instances;
// pub mod migrator; // 已使用SQL迁移文件
pub mod permissions;
pub mod projects;
pub mod roles;
pub mod shared;
pub mod users;
pub mod websocket;
pub mod maintenance;
pub mod audit;

// 导出主要的结构体和函数
pub use shared::database::DatabaseManager;
pub use websocket::server::WsServer;
