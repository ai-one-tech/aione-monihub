use actix_web::{web, App, HttpResponse, HttpServer, Result, middleware::Logger};
use env_logger;
use std::io;

mod auth;
mod handlers;
mod models;
mod db;
mod errors;
mod websocket;

use actix::prelude::*;
use db::Database;
use websocket::WsServer;

async fn health() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json("Server is running"))
}

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
            .route("/health", web::get().to(health))
            // Auth endpoints
            .route("/api/v1/auth/login", web::post().to(auth::login))
            .route("/api/v1/auth/forgot-password", web::post().to(auth::forgot_password))
            .route("/api/v1/auth/reset-password", web::post().to(auth::reset_password))
            // Project endpoints
            .route("/api/v1/projects", web::get().to(handlers::get_projects))
            .route("/api/v1/projects", web::post().to(handlers::create_project))
            .route("/api/v1/projects/{id}", web::get().to(handlers::get_project))
            .route("/api/v1/projects/{id}", web::put().to(handlers::update_project))
            .route("/api/v1/projects/{id}", web::delete().to(handlers::delete_project))
            // Application endpoints
            .route("/api/v1/applications", web::get().to(handlers::get_applications))
            .route("/api/v1/applications", web::post().to(handlers::create_application))
            .route("/api/v1/applications/{id}", web::get().to(handlers::get_application))
            .route("/api/v1/applications/{id}", web::put().to(handlers::update_application))
            .route("/api/v1/applications/{id}", web::delete().to(handlers::delete_application))
            // Deployment endpoints
            .route("/api/v1/deployments", web::get().to(handlers::get_deployments))
            .route("/api/v1/deployments", web::post().to(handlers::create_deployment))
            .route("/api/v1/deployments/{id}", web::get().to(handlers::get_deployment))
            .route("/api/v1/deployments/{id}", web::put().to(handlers::update_deployment))
            .route("/api/v1/deployments/{id}", web::delete().to(handlers::delete_deployment))
            .route("/api/v1/deployments/{id}/monitoring", web::get().to(handlers::get_deployment_monitoring))
            // File management endpoints
            .route("/api/v1/deployments/{id}/files", web::get().to(handlers::get_files))
            .route("/api/v1/deployments/{id}/files/upload", web::post().to(handlers::upload_file))
            .route("/api/v1/deployments/{id}/files/{file_path:.*}", web::get().to(handlers::download_file))
            .route("/api/v1/deployments/{id}/files/{file_path:.*}", web::delete().to(handlers::delete_file))
            // WebSocket endpoint for terminal access
            .route("/api/v1/deployments/{id}/terminal", web::get().to(websocket::terminal_websocket))
            // User endpoints
            .route("/api/v1/users", web::get().to(handlers::get_users))
            .route("/api/v1/users", web::post().to(handlers::create_user))
            .route("/api/v1/users/{id}", web::get().to(handlers::get_user))
            .route("/api/v1/users/{id}", web::put().to(handlers::update_user))
            .route("/api/v1/users/{id}", web::delete().to(handlers::delete_user))
            .route("/api/v1/users/{id}/disable", web::post().to(handlers::disable_user))
            .route("/api/v1/users/{id}/enable", web::post().to(handlers::enable_user))
            // Role endpoints
            .route("/api/v1/roles", web::get().to(handlers::get_roles))
            .route("/api/v1/roles", web::post().to(handlers::create_role))
            .route("/api/v1/roles/{id}", web::get().to(handlers::get_role))
            .route("/api/v1/roles/{id}", web::put().to(handlers::update_role))
            .route("/api/v1/roles/{id}", web::delete().to(handlers::delete_role))
            // Permission endpoints
            .route("/api/v1/permissions", web::get().to(handlers::get_permissions))
            .route("/api/v1/permissions/assign", web::post().to(handlers::assign_permissions))
            .route("/api/v1/permissions/revoke", web::post().to(handlers::revoke_permissions))
            // Log endpoints
            .route("/api/v1/logs", web::get().to(handlers::get_logs))
            .route("/api/v1/logs/export", web::get().to(handlers::export_logs))
            // Machine endpoints
            .route("/api/v1/machines", web::get().to(handlers::get_machines))
            .route("/api/v1/machines", web::post().to(handlers::create_machine))
            .route("/api/v1/machines/{id}", web::get().to(handlers::get_machine))
            .route("/api/v1/machines/{id}", web::put().to(handlers::update_machine))
            .route("/api/v1/machines/{id}", web::delete().to(handlers::delete_machine))
            .route("/api/v1/machines/{id}/monitoring-data", web::get().to(handlers::get_machine_monitoring_data))
            // Config endpoints
            .route("/api/v1/configs", web::get().to(handlers::get_configs))
            .route("/api/v1/configs", web::post().to(handlers::create_config))
            .route("/api/v1/configs/code/{code}", web::get().to(handlers::get_config_by_code))
            .route("/api/v1/configs/code/{code}/environment/{environment}", web::get().to(handlers::get_config_by_code_and_environment))
            .route("/api/v1/configs/code/{code}/environment/{environment}/version/{version}", web::get().to(handlers::get_config_by_code_env_and_version))
            .route("/api/v1/configs/{id}", web::delete().to(handlers::delete_config))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}