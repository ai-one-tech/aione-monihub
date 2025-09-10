use actix_web::{web, App, HttpResponse, HttpServer, Result, middleware::Logger};
use env_logger;

mod auth;
mod handlers;
mod models;
mod db;

use db::Database;

async fn health() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json("Server is running"))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    
    println!("Starting AiOne MoniHub API server...");
    
    // Initialize database
    let database = Database::new().expect("Failed to initialize database");
    
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(database.get_connection()))
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
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}