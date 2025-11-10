use chrono::{Duration, Utc};
use log::{error, info};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use std::time::Instant;

use crate::entities::instance_records;

/// 启动每日数据清理任务，在每天凌晨0点执行
pub fn start_data_cleaner(db: DatabaseConnection) {
    tokio::spawn(async move {
        // 计算到下一个凌晨0点的时间
        let now = Utc::now();
        let next_run = now.date_naive().and_hms_opt(0, 0, 0).unwrap() + Duration::days(1);
        let duration_until_next_run = (next_run - now.naive_utc()).to_std().unwrap();
        
        // 先等待到下一个0点
        tokio::time::sleep(duration_until_next_run).await;
        
        // 然后每天执行一次
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(24 * 60 * 60));
        loop {
            interval.tick().await;
            match run_data_cleanup(&db).await {
                Ok(deleted) => {
                    info!("[data_cleaner] 清理历史数据完成，删除记录数: {}", deleted);
                }
                Err(e) => error!("[data_cleaner] 数据清理失败: {}", e),
            }
        }
    });
}

/// 执行数据清理任务
/// 保留7天内的数据，删除更早的数据
async fn run_data_cleanup(db: &DatabaseConnection) -> Result<u64, sea_orm::DbErr> {
    let start = Instant::now();
    
    // 计算7天前的时间点
    let cutoff = Utc::now() - Duration::days(7);
    
    // 删除instance_records表中7天前的数据
    let res = instance_records::Entity::delete_many()
        .filter(instance_records::Column::CreatedAt.lt(cutoff))
        .exec(db)
        .await?;
    
    let elapsed_ms = start.elapsed().as_millis();
    info!(
        target: "data_cleaner",
        "数据清理完成 | 删除行数={} | 耗时={}ms | 保留数据截止时间={}",
        res.rows_affected,
        elapsed_ms,
        cutoff.to_rfc3339(),
    );
    
    Ok(res.rows_affected)
}

