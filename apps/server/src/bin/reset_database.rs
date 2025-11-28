use sea_orm::ConnectionTrait;
use sea_orm::{Database, DatabaseConnection, DbErr, FromQueryResult, Statement};
use serde::Deserialize;
use sqlx::PgPool;
use std::fs;
use std::path::Path;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 加载环境变量
    dotenv::dotenv().ok();

    println!("🔄 开始重置数据库...\n");

    // 获取数据库连接字符串
    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env file");

    println!("📡 连接到数据库: {}", mask_password(&database_url));

    // 建立 SeaORM 连接用于查询表
    let db: DatabaseConnection = Database::connect(&database_url).await?;

    // 建立原生 PostgreSQL 连接用于执行 SQL
    let pg_pool = PgPool::connect(&database_url).await?;

    println!("✅ 数据库连接成功\n");

    // 步骤 1: 删除所有现有表
    println!("🗑️  步骤 1: 删除现有表...");
    drop_all_tables(&db).await?;
    println!("✅ 所有表已删除\n");

    // 步骤 2: 执行所有迁移文件
    println!("📦 步骤 2: 执行迁移文件...");
    execute_migrations(&pg_pool).await?;
    println!("✅ 所有迁移文件执行完成\n");

    println!("🎉 数据库重置成功！");

    Ok(())
}

/// 数据库表信息结构
#[derive(Debug, FromQueryResult, Deserialize)]
struct TableInfo {
    tablename: String,
}

/// 删除所有表
async fn drop_all_tables(db: &DatabaseConnection) -> Result<(), DbErr> {
    // 从 PostgreSQL 系统表中查询所有用户表
    let sql = r#"
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    "#;

    let tables = TableInfo::find_by_statement(Statement::from_sql_and_values(
        db.get_database_backend(),
        sql,
        vec![],
    ))
    .all(db)
    .await?;

    if tables.is_empty() {
        println!("  ℹ️  没有找到需要删除的表");
        return Ok(());
    }

    println!("  📋 找到 {} 个表", tables.len());

    // 删除所有表（使用 CASCADE 自动处理依赖关系）
    for table in tables {
        let sql = format!("DROP TABLE IF EXISTS \"{}\" CASCADE", table.tablename);
        println!("  - 删除表: {}", table.tablename);

        db.execute(Statement::from_string(db.get_database_backend(), sql))
            .await?;
    }

    Ok(())
}

/// 执行所有迁移文件
async fn execute_migrations(pg_pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let migrations_dir = Path::new("migrations");

    if !migrations_dir.exists() {
        return Err("migrations 目录不存在".into());
    }

    // 获取所有 SQL 文件并排序
    let mut migration_files: Vec<_> = fs::read_dir(migrations_dir)?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry
                .path()
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| ext == "sql")
                .unwrap_or(false)
        })
        .collect();

    migration_files.sort_by_key(|entry| entry.file_name());

    if migration_files.is_empty() {
        return Err("未找到迁移文件".into());
    }

    // 执行每个迁移文件
    for entry in migration_files {
        let file_path = entry.path();
        let file_name = entry.file_name();
        let file_name_str = file_name.to_string_lossy();

        println!("  📄 执行: {}", file_name_str);

        // 读取 SQL 文件内容
        let sql_content = fs::read_to_string(&file_path)?;

        // 使用原生 PostgreSQL 执行 SQL
        execute_sql_file(pg_pool, &sql_content)
            .await
            .map_err(|e| format!("执行文件 {} 失败: {}", file_name_str, e))?;

        println!("     ✅ 完成");
    }

    Ok(())
}

/// 执行 SQL 文件内容（使用原生 PostgreSQL 连接，支持多条命令）
async fn execute_sql_file(
    pg_pool: &PgPool,
    sql_content: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // 使用 sqlx 的原生执行方法，支持多条 SQL 命令
    sqlx::raw_sql(sql_content).execute(pg_pool).await?;

    Ok(())
}

/// 隐藏数据库 URL 中的密码
fn mask_password(url: &str) -> String {
    if let Some(at_pos) = url.rfind('@') {
        if let Some(colon_pos) = url[..at_pos].rfind(':') {
            let mut masked = url.to_string();
            masked.replace_range(colon_pos + 1..at_pos, "****");
            return masked;
        }
    }
    url.to_string()
}
