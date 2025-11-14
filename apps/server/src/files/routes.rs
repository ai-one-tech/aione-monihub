use actix_web::web;

// 引入处理器
use super::handlers::{
    init_file_upload, upload_file_chunk,
    download_file, get_files
};

// 配置文件上传相关路由
pub fn file_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/files")
            .route("", web::get().to(get_files))
            // 初始化文件上传
            .route("/upload/init", web::post().to(init_file_upload))
            // 上传文件块
            .route("/upload/chunk", web::post().to(upload_file_chunk))
            // 下载文件
            .route("/download/{file_id}", web::get().to(download_file))
    );
}