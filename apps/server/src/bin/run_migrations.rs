use sea_orm::{Database, DatabaseConnection};
use sea_orm_migration::prelude::*;

mod migrator {
    use sea_orm_migration::prelude::*;
    
    pub struct Migrator;
    
    #[async_trait::async_trait]
    impl MigratorTrait for Migrator {
        fn migrations() -> Vec<Box<dyn MigrationTrait>> {
            vec![Box::new(crate::Migration)]
        }
    }
}

// 引入迁移文件
include!("../migrator.rs");

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 加载环境变量
    dotenv::dotenv().ok();
    
    println!("🚀 开始执行数据库迁移...");
    
    // 连接到 PostgreSQL
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in .env file");
    
    let db: DatabaseConnection = Database::connect(&database_url).await?;
    println!("✅ 已连接到 PostgreSQL 数据库");
    
    // 执行迁移
    migrator::Migrator::up(&db, None).await?;
    println!("✅ 数据库迁移完成！");
    
    Ok(())
}