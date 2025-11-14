use actix_web::web;

// 引入处理器
use super::handlers::{
    init_file_upload, upload_file_chunk, 
    complete_file_upload, check_upload_status,
    download_file
};

// 配置文件上传相关路由
pub fn file_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/files")
            .route("", web::get().to(super::handlers::get_files))
            // 初始化文件上传
            .route("/upload/init", web::post().to(init_file_upload))
            // 上传文件块
            .route("/upload/chunk", web::post().to(upload_file_chunk))
            // 完成文件上传
            .route("/upload/complete", web::post().to(complete_file_upload))
            // 检查上传状态
            .route("/upload/status/{upload_id}", web::get().to(check_upload_status))
            // 下载文件
            .route("/download/{file_id}", web::get().to(download_file))
    );
}