pub mod models;
pub mod db;
pub mod handlers;
pub mod routes;

use crate::shared::database::Database;

pub struct MachinesModule {
    database: Database,
}

impl MachinesModule {
    pub fn new(database: Database) -> Self {
        Self { database }
    }
}