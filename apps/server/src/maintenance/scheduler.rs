use log::info;
use sea_orm::DatabaseConnection;

use crate::maintenance::{offline_checker, data_cleaner};

/// 启动所有后台定时任务
pub fn start_all_scheduled_tasks(db: DatabaseConnection) {
    info!("启动所有后台定时任务...");
    
    // 启动离线巡检后台任务（每分钟执行一次）
    offline_checker::start_offline_checker(db.clone());
    info!("已启动离线巡检任务（每分钟执行）");
    
    // 启动数据清理后台任务（每天凌晨0点执行）
    data_cleaner::start_data_cleaner(db.clone());
    info!("已启动数据清理任务（每天凌晨0点执行）");
    
    info!("所有后台定时任务已启动完成");
}