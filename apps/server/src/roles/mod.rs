pub mod models;
pub mod db;
pub mod handlers;
pub mod routes;

use crate::shared::database::Database;

pub struct RolesModule {
    database: Database,
}

impl RolesModule {
    pub fn new(database: Database) -> Self {
        Self { database }
    }
}