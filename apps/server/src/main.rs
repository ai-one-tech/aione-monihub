use actix_web::{web, App, HttpServer, middleware::Logger};
use env_logger;
use std::io;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

// 使用新的模块结构
use aione_monihub_server::{DatabaseManager, WsServer};
use aione_monihub_server::health::handlers::health;

#[derive(OpenApi)]
#[openapi(
    paths(
        aione_monihub_server::health::handlers::health,
        aione_monihub_server::users::handlers::get_users,
        aione_monihub_server::users::handlers::create_user,
        aione_monihub_server::users::handlers::get_user,
        aione_monihub_server::users::handlers::update_user,
        aione_monihub_server::users::handlers::delete_user,
        aione_monihub_server::users::handlers::disable_user,
        aione_monihub_server::users::handlers::enable_user,
        aione_monihub_server::projects::handlers::get_projects,
        aione_monihub_server::projects::handlers::create_project,
        aione_monihub_server::projects::handlers::get_project,
        aione_monihub_server::projects::handlers::update_project,
        aione_monihub_server::projects::handlers::delete_project,
        aione_monihub_server::applications::handlers::get_applications,
        aione_monihub_server::applications::handlers::create_application,
        aione_monihub_server::applications::handlers::get_application,
        aione_monihub_server::applications::handlers::update_application,
        aione_monihub_server::applications::handlers::delete_application,
        aione_monihub_server::auth::handlers::login,
        aione_monihub_server::auth::handlers::forgot_password,
        aione_monihub_server::auth::handlers::reset_password,
        aione_monihub_server::auth::handlers::validate_token,
        aione_monihub_server::configs::handlers::get_configs,
        aione_monihub_server::configs::handlers::create_config,
        aione_monihub_server::configs::handlers::get_config_by_code,
        aione_monihub_server::configs::handlers::get_config_by_code_and_environment,
        aione_monihub_server::configs::handlers::get_config_by_code_env_and_version,
        aione_monihub_server::configs::handlers::delete_config
    ),
    components(
        schemas(
            aione_monihub_server::health::handlers::HealthResponse,
            aione_monihub_server::users::models::User,
            aione_monihub_server::users::models::UserResponse,
            aione_monihub_server::users::models::UserCreateRequest,
            aione_monihub_server::users::models::UserUpdateRequest,
            aione_monihub_server::users::models::UserListResponse,
            aione_monihub_server::users::models::Pagination,
            aione_monihub_server::projects::models::Project,
            aione_monihub_server::projects::models::ProjectResponse,
            aione_monihub_server::projects::models::ProjectCreateRequest,
            aione_monihub_server::projects::models::ProjectUpdateRequest,
            aione_monihub_server::projects::models::ProjectListResponse,
            aione_monihub_server::applications::models::Application,
            aione_monihub_server::applications::models::ApplicationResponse,
            aione_monihub_server::applications::models::ApplicationCreateRequest,
            aione_monihub_server::applications::models::ApplicationUpdateRequest,
            aione_monihub_server::applications::models::ApplicationListResponse,
            aione_monihub_server::applications::models::Authorization,
            aione_monihub_server::applications::models::AuthorizationResponse,
            aione_monihub_server::applications::models::AuthorizationCreateRequest,
            aione_monihub_server::auth::models::UserResponse,
            aione_monihub_server::auth::models::LoginRequest,
            aione_monihub_server::auth::models::LoginResponse,
            aione_monihub_server::auth::models::ForgotPasswordRequest,
            aione_monihub_server::auth::models::ResetPasswordRequest,
            aione_monihub_server::auth::models::Claims,
            aione_monihub_server::configs::models::Config,
            aione_monihub_server::configs::models::ConfigResponse,
            aione_monihub_server::configs::models::ConfigCreateRequest,
            aione_monihub_server::configs::models::ConfigUpdateRequest,
            aione_monihub_server::configs::models::ConfigListResponse
        )
    ),
    info(
        title = "AiOne MoniHub API",
        version = "0.1.0",
        description = "AiOne MoniHub 监控平台 API 文档",
        contact(
            name = "AiOne Tech",
            email = "support@aione.tech"
        )
    ),
    tags(
        (name = "health", description = "健康检查相关接口"),
        (name = "Users", description = "用户管理相关接口"),
        (name = "Projects", description = "项目管理相关接口"),
        (name = "Applications", description = "应用管理相关接口"),
        (name = "Authentication", description = "认证相关接口"),
        (name = "Configs", description = "配置管理相关接口")
    )
)]
struct ApiDoc;

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
    
    println!("Starting AiOne MoniHub API server with PostgreSQL...");
    
    // Load .env file
    dotenv::dotenv().ok();
    
    // Initialize database connection
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in .env file");
    let db_manager = DatabaseManager::new(&database_url).await
        .expect("Failed to initialize database connection");
    
    // Start WebSocket server
    let ws_server = WsServer::new().start();
    
    let db_connection = db_manager.get_connection().clone();
    
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db_connection.clone()))
            .app_data(web::Data::new(ws_server.clone()))
            .wrap(Logger::default())
            // Swagger UI
            .service(
                SwaggerUi::new("/swagger-ui/{_:.*}")
                    .url("/api-docs/openapi.json", ApiDoc::openapi())
            )
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