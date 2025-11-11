use chrono::{Duration, Utc};
use log::{error, info};
use sea_orm::sea_query::Expr;
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter};
use std::time::Instant;

use crate::entities::instances;
use crate::shared::enums;

/// 启动每分钟巡检任务，判断并标记离线实例
pub fn start_offline_checker(db: DatabaseConnection) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(60));
        loop {
            interval.tick().await;
            match run_offline_check(&db).await {
                Ok(updated) => {
                    if updated > 0 {
                        info!("[offline_checker] 标记离线实例数量: {}", updated);
                    } else {
                        info!("[offline_checker] 本次无离线变化");
                    }
                }
                Err(e) => error!("[offline_checker] 执行失败: {}", e),
            }
        }
    });
}

/// 执行一次离线检查与批量更新
async fn run_offline_check(db: &DatabaseConnection) -> Result<u64, sea_orm::DbErr> {
    let start = Instant::now();
    let cutoff = Utc::now() - Duration::minutes(5);
    let now = Utc::now();

    // 1) last_report_at <= cutoff 的 active 实例
    let res1 = instances::Entity::update_many()
        .col_expr(
            instances::Column::OnlineStatus,
            Expr::value(enums::OnlineStatus::Offline),
        )
        .col_expr(instances::Column::OfflineAt, Expr::value(now))
        .filter(instances::Column::DeletedAt.is_null())
        .filter(instances::Column::Status.eq(enums::Status::Active))
        .filter(instances::Column::OnlineStatus.eq(enums::OnlineStatus::Online))
        .filter(
            Condition::any()
                .add(instances::Column::LastReportAt.lte(cutoff))
                .add(instances::Column::LastReportAt.is_null()),
        )
        .exec(db)
        .await?;
    let total_updated = res1.rows_affected;

    let elapsed_ms = start.elapsed().as_millis();
    info!(
        target: "offline_checker",
        "离线巡检完成 | 更新行数={} | 耗时={}ms | 截止时间cutoff={} | 规则=last_report_at<=cutoff OR (last_report_at IS NULL AND (first_report_at<=cutoff OR (first_report_at IS NULL AND created_at<=cutoff))))",
        total_updated,
        elapsed_ms,
        cutoff.to_rfc3339(),
    );

    Ok(total_updated)
}
