#[cfg(test)]
mod tests {
    use super::*;
    use crate::entities::logs::{ActiveModel, Column, Entity as Logs, Model};
    use crate::logs::handlers::LogListQuery;
    use crate::shared::database::DatabaseManager;
    use crate::shared::error::ApiError;
    use actix_web::{test, web, App};
    use sea_orm::{ActiveModelTrait, EntityTrait, Set};
    use std::env;

    // 创建测试数据库连接
    async fn create_test_db() -> DatabaseManager {
        let db_url = env::var("TEST_DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/aione_test".to_string());
        DatabaseManager::new(&db_url).await.unwrap()
    }

    // 创建测试日志数据
    async fn create_test_log(db: &DatabaseManager, log_level: &str) -> Model {
        let now = chrono::Utc::now().naive_utc();
        let log = ActiveModel {
            id: Set("9876543210987654321".to_string()),
            application_id: Set(Some("app_123".to_string())),
            log_level: Set(log_level.to_string()),
            message: Set("Test log message".to_string()),
            context: Set(None),
            log_source: Set(Some("test_source".to_string())),
            timestamp: Set(now),
            created_at: Set(now),
            updated_at: Set(now),
            user_id: Set(Some("user_123".to_string())),
            ip_address: Set(Some("127.0.0.1".to_string())),
            user_agent: Set(Some("test_agent".to_string())),
        };

        log.insert(db.get_connection()).await.unwrap()
    }

    #[actix_web::test]
    async fn test_get_logs() {
        let db = create_test_db().await;
        let db_data = web::Data::new(db.get_connection().clone());

        // 创建测试数据
        create_test_log(&db, "info").await;
        create_test_log(&db, "error").await;

        // 创建查询参数
        let query = web::Query(LogListQuery {
            page: Some(1),
            limit: Some(10),
            log_level: None,
            user_id: None,
            start_date: None,
            end_date: None,
        });

        let result = super::get_logs(query, db_data).await;
        assert!(result.is_ok());
    }

    #[actix_web::test]
    async fn test_export_logs() {
        let db = create_test_db().await;
        let db_data = web::Data::new(db.get_connection().clone());

        // 创建测试数据
        create_test_log(&db, "info").await;
        create_test_log(&db, "error").await;

        // 创建查询参数
        let query = web::Query(LogListQuery {
            page: Some(1),
            limit: Some(10),
            log_level: None,
            user_id: None,
            start_date: None,
            end_date: None,
        });

        let result = super::export_logs(query, db_data).await;
        assert!(result.is_ok());
    }

    #[actix_web::test]
    async fn test_get_logs_with_filter() {
        let db = create_test_db().await;
        let db_data = web::Data::new(db.get_connection().clone());

        // 创建测试数据
        create_test_log(&db, "debug").await;

        // 创建查询参数，过滤特定日志级别
        let query = web::Query(LogListQuery {
            page: Some(1),
            limit: Some(10),
            log_level: Some("debug".to_string()),
            user_id: None,
            start_date: None,
            end_date: None,
        });

        let result = super::get_logs(query, db_data).await;
        assert!(result.is_ok());
    }

    #[actix_web::test]
    async fn test_export_logs_with_filter() {
        let db = create_test_db().await;
        let db_data = web::Data::new(db.get_connection().clone());

        // 创建测试数据
        create_test_log(&db, "warning").await;

        // 创建查询参数，过滤特定日志级别
        let query = web::Query(LogListQuery {
            page: Some(1),
            limit: Some(10),
            log_level: Some("warning".to_string()),
            user_id: None,
            start_date: None,
            end_date: None,
        });

        let result = super::export_logs(query, db_data).await;
        assert!(result.is_ok());
    }
}