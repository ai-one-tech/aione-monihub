use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use env_logger;
use std::io;
use utoipa::OpenApi;
use utoipa::{
    openapi::security::{Http, HttpAuthScheme, SecurityScheme},
    Modify,
};
use utoipa_swagger_ui::SwaggerUi;

// 使用新的模块结构
use aione_monihub_server::auth::middleware::AuthMiddleware;
use aione_monihub_server::{DatabaseManager, WsServer};

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
        aione_monihub_server::roles::handlers::get_roles,
        aione_monihub_server::roles::handlers::create_role,
        aione_monihub_server::roles::handlers::get_role,
        aione_monihub_server::roles::handlers::update_role,
        aione_monihub_server::roles::handlers::delete_role,
        aione_monihub_server::roles::handlers::get_role_permissions,
        aione_monihub_server::permissions::handlers::get_permissions,
        aione_monihub_server::permissions::handlers::create_permission,
        aione_monihub_server::permissions::handlers::get_permission,
        aione_monihub_server::permissions::handlers::update_permission,
        aione_monihub_server::permissions::handlers::delete_permission,
        aione_monihub_server::permissions::handlers::get_user_menu,
        aione_monihub_server::users::handlers::assign_user_roles,
        aione_monihub_server::users::handlers::remove_user_role,
        aione_monihub_server::users::handlers::get_user_roles,
        aione_monihub_server::auth::handlers::login,
        aione_monihub_server::auth::handlers::forgot_password,
        aione_monihub_server::auth::handlers::reset_password,
        aione_monihub_server::auth::handlers::validate_token,
        aione_monihub_server::auth::handlers::get_current_user,
        aione_monihub_server::configs::handlers::get_configs,
        aione_monihub_server::configs::handlers::create_config,
        aione_monihub_server::configs::handlers::get_config_by_code,
        aione_monihub_server::configs::handlers::get_config_by_code_and_environment,
        aione_monihub_server::configs::handlers::get_config_by_code_env_and_version,
        aione_monihub_server::configs::handlers::delete_config,
        aione_monihub_server::instance_tasks::handlers::get_instance_tasks,
        aione_monihub_server::instance_tasks::handlers::submit_task_result,
        aione_monihub_server::instance_tasks::handlers::get_task_instances_with_results
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
            aione_monihub_server::auth::models::UserResponse,
            aione_monihub_server::auth::models::LoginRequest,
            aione_monihub_server::auth::models::LoginResponse,
            aione_monihub_server::auth::models::ForgotPasswordRequest,
            aione_monihub_server::auth::models::ResetPasswordRequest,
            aione_monihub_server::auth::models::Claims,
            aione_monihub_server::auth::models::CurrentUserResponse,
            aione_monihub_server::configs::models::Config,
            aione_monihub_server::configs::models::ConfigResponse,
            aione_monihub_server::configs::models::ConfigCreateRequest,
            aione_monihub_server::configs::models::ConfigUpdateRequest,
            aione_monihub_server::configs::models::ConfigListResponse,
            aione_monihub_server::roles::models::Role,
            aione_monihub_server::roles::models::RoleResponse,
            aione_monihub_server::roles::models::RoleCreateRequest,
            aione_monihub_server::roles::models::RoleUpdateRequest,
            aione_monihub_server::roles::models::RoleListResponse,
            aione_monihub_server::roles::models::RolePermissionResponse,
            aione_monihub_server::roles::models::RolePermissionListResponse,
            aione_monihub_server::permissions::models::PermissionResponse,
            aione_monihub_server::permissions::models::PermissionListResponse,
            aione_monihub_server::permissions::models::PermissionCreateRequest,
            aione_monihub_server::permissions::models::PermissionUpdateRequest,
            aione_monihub_server::permissions::models::MenuItemResponse,
            aione_monihub_server::permissions::models::UserMenuResponse,
            aione_monihub_server::users::models::UserRoleAssignRequest,
            aione_monihub_server::users::models::UserRoleResponse,
            aione_monihub_server::users::models::UserRoleListResponse,
            aione_monihub_server::instance_tasks::models::TaskCreateRequest,
            aione_monihub_server::instance_tasks::models::TaskResponse,
            aione_monihub_server::instance_tasks::models::TaskListResponse,
            aione_monihub_server::instance_tasks::models::TaskResultSubmitRequest,
            aione_monihub_server::instance_tasks::models::TaskResultSubmitResponse,
            aione_monihub_server::instance_tasks::models::TaskDispatchResponse,
            aione_monihub_server::instance_tasks::models::TaskDispatchItem,
            aione_monihub_server::instance_tasks::models::Pagination,
            aione_monihub_server::instance_tasks::models::InstanceInfo,
            aione_monihub_server::instance_tasks::models::TaskInstanceWithResult,
            aione_monihub_server::instance_tasks::models::TaskInstanceWithResultResponse
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
    security(
        ("bearer_auth" = [])
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "health", description = "健康检查相关接口"),
        (name = "Users", description = "用户管理相关接口"),
        (name = "Projects", description = "项目管理相关接口"),
        (name = "Applications", description = "应用管理相关接口"),
        (name = "Roles", description = "角色管理相关接口"),
        (name = "Permissions", description = "权限管理相关接口"),
        (name = "Authentication", description = "认证相关接口"),
        (name = "Configs", description = "配置管理相关接口"),
        (name = "Instance Tasks", description = "实例任务管理相关接口")
    )
)]
struct ApiDoc;

// Security addon for Swagger authentication
struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer_auth",
                SecurityScheme::Http(Http::new(HttpAuthScheme::Bearer)),
            )
        }
    }
}

// 导入所有模块的路由函数
use aione_monihub_server::applications::routes::application_routes;
use aione_monihub_server::auth::routes::auth_routes;
use aione_monihub_server::configs::routes::config_routes;
use aione_monihub_server::health::routes::health_routes;
use aione_monihub_server::instance_reports::routes::{
    instance_report_routes, open_instance_report_routes,
};
use aione_monihub_server::instance_tasks::routes::{
    instance_task_routes, open_instance_task_routes,
};
use aione_monihub_server::instances::routes::instance_routes;
use aione_monihub_server::logs::routes::log_routes;
use aione_monihub_server::permissions::routes::permission_routes;
use aione_monihub_server::projects::routes::project_routes;
use aione_monihub_server::roles::routes::role_routes;
use aione_monihub_server::users::routes::user_routes;

// 添加Actor trait导入以使用start方法
use actix::Actor;
use aione_monihub_server::websocket::routes::websocket_routes;
use aione_monihub_server::maintenance::scheduler::start_all_scheduled_tasks;

#[actix_web::main]
async fn main() -> io::Result<()> {
    env_logger::init();

    println!("Starting AiOne MoniHub API server with PostgresSQL...");

    // Load .env file
    dotenv::dotenv().ok();

    // Initialize database connection
    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env file");
    let db_manager = DatabaseManager::new(&database_url)
        .await
        .expect("Failed to initialize database connection");

    // Start WebSocket server
    let ws_server = WsServer::new().start();

    // 获取服务器配置
    let server_host = std::env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let server_port = std::env::var("SERVER_PORT").unwrap_or_else(|_| "9080".to_string());
    let bind_address = format!("{}:{}", server_host, server_port);

    println!("服务器将在 http://{} 上启动", bind_address);

    let db_connection = db_manager.get_connection().clone();

    // 启动所有后台定时任务
    start_all_scheduled_tasks(db_connection.clone());

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db_connection.clone()))
            .app_data(web::Data::new(ws_server.clone()))
            // 配置CORS中间件
            .wrap(
                Cors::default()
                    .allow_any_origin() // 允许所有源（生产环境中应该指定具体的域名）
                    .allow_any_method() // 允许所有HTTP方法
                    .allow_any_header() // 允许所有请求头
                    .supports_credentials(), // 支持cookies和认证信息
            )
            .wrap(Logger::default())
            .wrap(AuthMiddleware) // 添加JWT认证中间件
            // Swagger UI
            .service(
                SwaggerUi::new("/swagger-ui/{_:.*}")
                    .url("/api-docs/openapi.json", ApiDoc::openapi()),
            )
            // Health check (outside /api scope)
            .configure(health_routes)
            // API routes (all under /api scope)
            .service(
                web::scope("/api")
                    .configure(auth_routes)
                    .configure(project_routes)
                    .configure(application_routes)
                    .configure(user_routes)
                    .configure(role_routes)
                    .configure(permission_routes)
                    .configure(instance_report_routes)
                    .configure(instance_task_routes)
                    .configure(instance_routes)
                    .configure(config_routes)
                    .configure(websocket_routes)
                    .configure(log_routes)
                    // Open API routes (no authentication required)
                    .service(
                        web::scope("/open/instances")
                            .configure(open_instance_report_routes)
                            .configure(open_instance_task_routes),
                    ),
            )
    })
    .bind(&bind_address)?
    .run()
    .await
}
