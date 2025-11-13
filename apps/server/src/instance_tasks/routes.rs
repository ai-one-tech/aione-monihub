use actix_web::web;
use super::handlers;

pub fn instance_task_routes(cfg: &mut web::ServiceConfig) {
    // 任务管理（需要认证）
    cfg.route("/instances/tasks", web::post().to(handlers::create_task))
        .route("/instances/tasks", web::get().to(handlers::get_tasks))
        .route("/instances/tasks/{task_id}", web::get().to(handlers::get_task))
        .route("/instances/tasks/{task_id}", web::delete().to(handlers::delete_task))
        .route("/instances/tasks/{task_id}/cancel", web::post().to(handlers::cancel_task))
        .route("/instances/tasks/{task_id}/records", web::get().to(handlers::get_task_records))
        .route("/instances/tasks/{task_id}/instances-with-results", web::get().to(handlers::get_task_instances_with_results))
        .route("/instances/task-records/{record_id}/retry", web::post().to(handlers::retry_task_record))
        .route("/instances/task-records/{record_id}/set-pending", web::post().to(handlers::set_task_record_pending));
}

pub fn open_instance_task_routes(cfg: &mut web::ServiceConfig) {
    // 任务下发和结果回传（开放接口，无需认证）
    cfg.route("/tasks", web::get().to(handlers::get_instance_tasks))
        .route("/tasks/result", web::post().to(handlers::submit_task_result));
}
