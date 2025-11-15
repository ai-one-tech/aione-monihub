/// Rust 版 MoniHub Agent 入口
///
/// 职责：
/// - 解析命令行参数并加载配置文件
/// - 启动实例上报服务与任务拉取执行服务
/// - 监听 Ctrl+C 信号，收到后优雅退出
use clap::Parser;
use tokio::signal;

mod config;
mod executor;
mod handlers;
mod agent_logger;
mod log_store;
mod models;
mod services;
mod utils;

#[derive(Parser, Debug)]
/// 命令行参数结构体
struct Cli {
    #[arg(short, long, default_value = "./config.yaml")]
    config: String,
}

#[tokio::main]
async fn main() {
    let args = Cli::parse();
    let cfg = config::Config::load(args.config.as_str()).unwrap_or_default();
    agent_logger::init(&cfg);
    let state = services::AppState::new(cfg.clone());
    agent_logger::set_state(state.clone());
    agent_logger::info("Agent 启动");
    agent_logger::info(&format!("配置加载完成 server={} debug={}", cfg.server_url, cfg.debug));
    // 开启实例信息上报服务（异步定时任务）
    services::report::start(state.clone()).await;

    // 开启任务拉取/执行服务（长轮询 + 并发执行）
    services::tasks::start(state.clone()).await;

    // 阻塞等待 Ctrl+C 信号，实现优雅退出
    let _ = signal::ctrl_c().await;
    agent_logger::info("收到退出信号，准备退出");
}
