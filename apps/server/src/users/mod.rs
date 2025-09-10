pub mod models;
pub mod db;
pub mod handlers;
pub mod routes;

use crate::shared::database::Database;

pub struct UsersModule {
    database: Database,
}

impl UsersModule {
    pub fn new(database: Database) -> Self {
        Self { database }
    }
}