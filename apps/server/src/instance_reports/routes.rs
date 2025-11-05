use actix_web::web;
use super::handlers;

pub fn instance_report_routes(cfg: &mut web::ServiceConfig) {
    // 查询实例上报历史（需要认证）
    cfg.route("/instances/{instance_id}/reports", web::get().to(handlers::get_instance_reports));
}

pub fn open_instance_report_routes(cfg: &mut web::ServiceConfig) {
    // 实例信息上报（开放接口，无需认证）
    cfg.route("/report", web::post().to(handlers::report_instance_info));
}
