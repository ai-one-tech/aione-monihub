use crate::services::AppState;
use env_logger::Builder;
use log::LevelFilter;
use once_cell::sync::OnceCell;
use std::sync::atomic::{AtomicBool, Ordering};

static STATE: OnceCell<AppState> = OnceCell::new();
static LOGGER_INITIALIZED: AtomicBool = AtomicBool::new(false);

pub fn init(cfg: &crate::config::Config) {
    let mut b = Builder::from_default_env();
    if cfg.debug {
        b.filter_level(LevelFilter::Debug);
    } else {
        b.filter_level(LevelFilter::Warn);
    }
    if b.try_init().is_ok() {
        LOGGER_INITIALIZED.store(true, Ordering::Relaxed);
    }
}

pub fn set_state(state: AppState) {
    let _ = STATE.set(state);
}

pub fn info(message: &str) {
    if let Some(state) = STATE.get() {
        if state.cfg.debug {
            log::info!("{}", message);
            state.logs.push("INFO", message);
        }
    }
}

pub fn warn(message: &str) {
    log::warn!("{}", message);
    if let Some(state) = STATE.get() {
        state.logs.push("WARN", message);
    }
}

pub fn error(message: &str) {
    if !LOGGER_INITIALIZED.load(Ordering::Relaxed) {
        eprintln!("{}", message);
    }
    log::error!("{}", message);
    if let Some(state) = STATE.get() {
        state.logs.push("ERROR", message);
    }
}

#[allow(dead_code)]
pub fn debug(message: &str) {
    if let Some(state) = STATE.get() {
        if state.cfg.debug {
            log::debug!("{}", message);
            state.logs.push("DEBUG", message);
        }
    }
}