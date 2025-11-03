use actix_web::web;
use super::handlers;

pub fn instance_task_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/instances")
            // 任务管理（需要认证）
            .route("/tasks", web::post().to(handlers::create_task))
            .route("/tasks", web::get().to(handlers::get_tasks))
            .route("/tasks/{task_id}", web::get().to(handlers::get_task))
            .route("/tasks/{task_id}", web::delete().to(handlers::delete_task))
            .route("/tasks/{task_id}/cancel", web::post().to(handlers::cancel_task))
            .route("/tasks/{task_id}/records", web::get().to(handlers::get_task_records))
            .route("/task-records/{record_id}/retry", web::post().to(handlers::retry_task_record))
    );
}

pub fn open_instance_task_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/open/instances")
            // 任务下发和结果回传（开放接口，无需认证）
            .route("/{instance_id}/tasks", web::get().to(handlers::get_instance_tasks))
            .route("/tasks/result", web::post().to(handlers::submit_task_result))
    );
}
