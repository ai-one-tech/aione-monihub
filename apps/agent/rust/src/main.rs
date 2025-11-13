use clap::Parser;
use tokio::signal;

mod config;
mod models;
mod log_store;
mod services;
mod executor;
mod handlers;
mod utils;

#[derive(Parser, Debug)]
struct Cli {
    #[arg(short, long, default_value = "")] 
    config: String,
}

#[tokio::main]
async fn main() {
    let args = Cli::parse();
    let cfg = config::Config::load(args.config.as_str()).unwrap_or_default();
    let state = services::AppState::new(cfg.clone());
    if cfg.report.enabled { services::report::start(state.clone()).await; }
    if cfg.task.enabled { services::tasks::start(state.clone()).await; }
    let _ = signal::ctrl_c().await;
}

