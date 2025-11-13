## 总览
- 目标：Agent 按任务下载并压缩需要上传的文件/目录；Server 以分片方式接收并支持断点续传；开始上传即在 `files` 表创建记录并用于持久化会话；合并完成后保存到 `uploads/<task_id>/`，文件命名为 `<instance_id>_<original_name>.<ext>`；Agent 回传下载地址与文件记录ID并更新任务状态。
- 现状：
  - Agent：本地→服务端仅支持 Base64（≤10MB）（apps/agent/java/.../FileManagerHandler.java:463–497），远端URL→本地已支持断点续传（299–444）。
  - Server：已实现 init/chunk/complete/status 路由（apps/server/src/files/routes.rs:11–24），分片逻辑与合并可用（handlers.rs:115–331），但会话存内存，最终文件路径与命名未按任务/实例要求。

## Server 改造（files 表持久化会话）
1. 初始化上传：`POST /api/files/upload/init`（apps/server/src/files/handlers.rs:50–110）
- 行为变更：
  - 解析 `task_id`、`instance_id`、`file_name`、`file_extension`、`total_size`、`chunk_size`、`total_chunks`。
  - 立即在 `files` 表插入一条记录（apps/server/src/entities/files.rs），字段包含：
    - `task_id`、`instance_id`、`file_name`、`file_extension`、`total_size`、`chunk_size`、`total_chunks`、`uploaded_chunks_json`（初始空数组或布尔位图）、`status="uploading"`、`final_path`（NULL）。
  - 返回 `upload_id = file_id`（DB记录主键），并在服务端以此 `file_id` 作为会话标识。
  - 临时分片保存路径建议：`./uploads/<task_id>/<file_id>_<chunk_index>.chunk`，确保目录存在。

2. 分片上传：`POST /api/files/upload/chunk`（apps/server/src/files/handlers.rs:115–229）
- 行为变更：
  - 改为流式写入分片，避免将分片读入内存（使用 `tokio::io::copy`）。
  - 按 `upload_id=file_id` 定位记录，更新 `uploaded_chunks_json` 中对应索引为已上传。
  - 可选：记录每个分片的校验和（md5/sha256）字段，提升完整性校验。

3. 上传状态：`GET /api/files/upload/status/{upload_id}`（handlers.rs:337–384）
- 行为变更：
  - 直接从 `files` 表读取 `total_chunks` 与 `uploaded_chunks_json`，返回已上传计数与明细，支持服务重启后续传。

4. 完成上传：`POST /api/files/upload/complete`（handlers.rs:235–331）
- 行为变更：
  - 校验 `uploaded_chunks_json` 是否完整；按照索引合并分片到最终文件路径：
    - `final_path = ./uploads/<task_id>/<instance_id>_<original_name>.<ext>`（确保目录存在）。
  - 写入完成后删除 `*.chunk` 临时文件，更新 `files` 表记录：`status="completed"`、`final_path`、`uploaded_at`。
  - 返回 `file_id` 与可下载地址（`/api/files/download/{file_id}`）。

## Agent 改造（目录压缩与统一分片上传）
1. 目录打包为 ZIP
- 改造点：`FileManagerHandler.executeDownloadFile(...)`（apps/agent/java/.../FileManagerHandler.java:463–497）
- 行为：
  - 若 `file_path` 为目录：使用 `ZipOutputStream` 流式遍历压缩到临时 `archive.zip`（临时目录：`TaskTempUtils.ensureSubDir("archives")`）。
  - 记录 `is_directory=true` 与 `original_name` 元信息。

2. 单文件大小判断与压缩
- 行为：
  - 单文件 `>10MB`：尝试压缩为 zip；若压缩后仍大，则直接走分片上传。
  - `<=10MB`：也走统一分片上传（单分片），避免 Base64 通道限制与后续不一致。

3. 分片上传协议对接（OkHttp Multipart）
- 流程：
  - 调用 `POST /api/files/upload/init` 获取 `upload_id=file_id` 与分片参数（建议由Agent决定 `chunk_size`，默认 8MB）。
  - 循环 `POST /api/files/upload/chunk` 发送分片，失败时查询 `GET /api/files/upload/status/{upload_id}`，仅补发缺失分片。
  - `POST /api/files/upload/complete` 完成合并，拿到 `file_id` 与下载地址。
- 回传任务结果：通过 `InstanceTaskService.submitResult(...)`（apps/agent/java/.../InstanceTaskService.java:183–239），填充：`download_url`、`file_record_id=file_id`、`is_directory`、`compressed`、`final_name`、`size`，并更新 `status`。

## 细节与校验
- 命名规范：避免双扩展；当 `original_name` 已含扩展，仅保留一个；必要时过滤特殊字符。
- 覆盖策略：同目录同名文件存在时，追加时间戳或随机后缀。
- 5GB 支持：通过分片与流式写入即可支撑；建议分片大小 4–16MB；服务端避免一次性加载分片。
- 会话持久化：以 `files` 表记录作为唯一会话来源，重启后可恢复；状态字段包括 `uploading/completed/failed`。

## 验证
- Server：`cargo check`/`cargo build` 编译通过；使用 1GB–5GB 文件分片上传测试状态查询与合并。
- Agent：目录压缩与单文件压缩验证；断点续传模拟中断后续传；端到端联调：任务下发→Agent执行→Server保存→Agent回传结果。

若确认以上调整（尤其“开始上传即创建 files 记录，断点会话持久化到 files 表”），我将据此实施具体代码改造。