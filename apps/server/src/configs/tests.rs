#[cfg(test)]
mod tests {
    use crate::configs::models::{ConfigCreateRequest, ConfigListQuery};
    use crate::entities::configs::{ActiveModel, Column, Entity as Configs, Model};
    use crate::shared::database::DatabaseManager;
    use crate::shared::error::ApiError;
    use actix_web::{test, web, App};
    use sea_orm::{ActiveModelTrait, EntityTrait, Set};
    use std::env;

    // 创建测试数据库连接
    async fn create_test_db() -> DatabaseManager {
        let db_url = env::var("TEST_DATABASE_URL").unwrap_or_else(|_| {
            "postgres://postgres:postgres@localhost:5432/aione_test".to_string()
        });
        DatabaseManager::new(&db_url).await.unwrap()
    }

    // 创建测试配置数据
    async fn create_test_config(db: &DatabaseManager, code: &str, environment: &str) -> Model {
        let config = ActiveModel {
            id: Set("1234567890123456789".to_string()),
            code: Set(code.to_string()),
            environment: Set(environment.to_string()),
            name: Set("Test Config".to_string()),
            config_type: Set("json".to_string()),
            content: Set("{\"test\": \"value\"}".to_string()),
            description: Set(Some("Test configuration".to_string())),
            version: Set(1),
            created_by: Set("test_user".to_string()),
            updated_by: Set("test_user".to_string()),
            deleted_at: Set(None),
            revision: Set(1),
            created_at: Set(chrono::Utc::now().naive_utc()),
            updated_at: Set(chrono::Utc::now().naive_utc()),
        };

        config.insert(db.get_connection()).await.unwrap()
    }

    #[actix_web::test]
    async fn test_get_configs() {
        let db = create_test_db().await;
        let db_data = web::Data::new(db.get_connection().clone());

        // 创建测试数据
        create_test_config(&db, "test_config_1", "development").await;
        create_test_config(&db, "test_config_2", "production").await;

        // 创建HTTP请求
        let req = test::TestRequest::get()
            .uri("/api/configs")
            .app_data(db_data.clone())
            .to_request();

        // 调用handler函数
        let query = web::Query(ConfigListQuery {
            page: Some(1),
            limit: Some(10),
            search: None,
            config_type: None,
            environment: None,
            all_versions: None,
        });

        let result = super::get_configs(query, db_data).await;
        assert!(result.is_ok());
    }

    #[actix_web::test]
    async fn test_create_config() {
        let db = create_test_db().await;
        let db_data = web::Data::new(db.get_connection().clone());

        // 创建HTTP请求
        let req = test::TestRequest::post()
            .uri("/api/configs")
            .app_data(db_data.clone())
            .to_request();

        // 创建测试数据
        let config_request = ConfigCreateRequest {
            code: "new_test_config".to_string(),
            environment: "test".to_string(),
            name: "New Test Config".to_string(),
            config_type: "json".to_string(),
            content: "{\"new_test\": \"value\"}".to_string(),
            description: "New test configuration".to_string(),
        };

        let json_data = web::Json(config_request);

        let result = super::create_config(json_data, db_data).await;
        assert!(result.is_ok());
    }

    #[actix_web::test]
    async fn test_get_config_by_code() {
        let db = create_test_db().await;
        let db_data = web::Data::new(db.get_connection().clone());

        // 创建测试数据
        create_test_config(&db, "search_config", "development").await;

        // 创建HTTP请求
        let req = test::TestRequest::get()
            .uri("/api/configs/search_config")
            .app_data(db_data.clone())
            .to_request();

        let path = web::Path("search_config".to_string());

        let result = super::get_config_by_code(path, db_data).await;
        assert!(result.is_ok());
    }

    #[actix_web::test]
    async fn test_get_config_by_code_and_environment() {
        let db = create_test_db().await;
        let db_data = web::Data::new(db.get_connection().clone());

        // 创建测试数据
        create_test_config(&db, "env_config", "staging").await;

        // 创建HTTP请求
        let req = test::TestRequest::get()
            .uri("/api/configs/env_config/staging")
            .app_data(db_data.clone())
            .to_request();

        let path = web::Path(("env_config".to_string(), "staging".to_string()));

        let result = super::get_config_by_code_and_environment(path, db_data).await;
        assert!(result.is_ok());
    }

    #[actix_web::test]
    async fn test_get_config_by_code_env_and_version() {
        let db = create_test_db().await;
        let db_data = web::Data::new(db.get_connection().clone());

        // 创建测试数据
        create_test_config(&db, "version_config", "production").await;

        // 创建HTTP请求
        let req = test::TestRequest::get()
            .uri("/api/configs/version_config/production/1")
            .app_data(db_data.clone())
            .to_request();

        let path = web::Path(("version_config".to_string(), "production".to_string(), 1u32));

        let result = super::get_config_by_code_env_and_version(path, db_data).await;
        assert!(result.is_ok());
    }

    #[actix_web::test]
    async fn test_delete_config() {
        let db = create_test_db().await;
        let db_data = web::Data::new(db.get_connection().clone());

        // 创建测试数据
        let config = create_test_config(&db, "delete_config", "test").await;

        // 创建HTTP请求
        let req = test::TestRequest::delete()
            .uri(&format!("/api/configs/{}", config.id))
            .app_data(db_data.clone())
            .to_request();

        let path = web::Path(config.id);

        let result = super::delete_config(path, db_data).await;
        assert!(result.is_ok());
    }
}
