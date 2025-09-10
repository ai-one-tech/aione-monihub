use actix_web::{web, App, HttpServer, middleware::Logger};
use env_logger;
use std::io;

// 使用新的模块结构
use aione_monihub_server::{Database, WsServer};
use aione_monihub_server::health::handlers::health;

// 导入所有模块的路由函数
use aione_monihub_server::health::routes::health_routes;
use aione_monihub_server::auth::routes::auth_routes;
use aione_monihub_server::projects::routes::project_routes;
use aione_monihub_server::applications::routes::application_routes;
use aione_monihub_server::deployments::routes::deployment_routes;
use aione_monihub_server::users::routes::user_routes;
use aione_monihub_server::roles::routes::role_routes;
use aione_monihub_server::permissions::routes::permission_routes;
use aione_monihub_server::machines::routes::machine_routes;
use aione_monihub_server::configs::routes::config_routes;
use aione_monihub_server::logs::routes::log_routes;

// 添加Actor trait导入以使用start方法
use actix::Actor;
use aione_monihub_server::websocket::routes::websocket_routes;

#[actix_web::main]
async fn main() -> io::Result<()> {
    env_logger::init();
    
    println!("Starting AiOne MoniHub API server...");
    
    // Initialize database
    let database = Database::new().expect("Failed to initialize database");
    
    // Start WebSocket server
    let ws_server = WsServer::new().start();
    
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(database.get_connection()))
            .app_data(web::Data::new(ws_server.clone()))
            .wrap(Logger::default())
            // Health endpoint
            .route("/health", web::get().to(health))
            // 注册所有模块的路由
            .configure(health_routes)
            .configure(auth_routes)
            .configure(project_routes)
            .configure(application_routes)
            .configure(deployment_routes)
            .configure(user_routes)
            .configure(role_routes)
            .configure(permission_routes)
            .configure(machine_routes)
            .configure(config_routes)
            .configure(websocket_routes)
            .configure(log_routes)
    })
    .bind("127.0.0.1:9080")?
    .run()
    .await
}