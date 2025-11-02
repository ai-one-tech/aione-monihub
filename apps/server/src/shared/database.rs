use sea_orm::{Database, DatabaseConnection, DbErr};

#[derive(Clone)]
pub struct DatabaseManager {
    pub connection: DatabaseConnection,
}

impl DatabaseManager {
    pub async fn new(database_url: &str) -> Result<Self, DbErr> {
        println!("Initializing PostgreSQL database connection...");

        println!("Connecting to database: {}", database_url);

        // 建立数据库连接
        let connection = Database::connect(database_url).await?;


        println!("Database connection established successfully");

        Ok(DatabaseManager { connection })
    }

    pub fn get_connection(&self) -> &DatabaseConnection {
        &self.connection
    }
}
