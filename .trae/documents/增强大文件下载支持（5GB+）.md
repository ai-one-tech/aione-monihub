## 需求更新
- 当远程文件大小 > 10MB 时，自动启用断点续传，无需显式配置开关。
- 入参字段将 `target`/`path` 统一改为 `save`（优先读取 `save`，为兼容可回退读取 `path`）。

## 改动目标
- 提升大文件（5GB+）下载的可靠性：自动续传、临时文件与原子重命名、超时优化、空间预检、结果元数据。

## 具体改动
- 入参解析：
  - 从 `taskContent` 读取 `save`（若为空则读取旧字段 `path` 以兼容）。
  - `remote_url` 保持不变。
- 自动续传判定：
  - 先发 `HEAD` 请求获取 `Content-Length`；当 `content_length >= 10 * 1024 * 1024` 时启用续传流程。
  - 若 `HEAD` 不可用或无长度，仍采用 `.part` 临时文件策略；若存在 `.part` 则按现有大小续传；否则全量下载。
- 客户端与超时：
  - 注入全局 `OkHttpClient`，在方法内派生更长超时的客户端（连接 30s、读/写 30min、`retryOnConnectionFailure(true)`、`followRedirects(true)`）。
- 请求与头：
  - 明确 `Accept-Encoding: identity`，确保长度与范围稳定；续传时添加 `Range: bytes=<已下载大小>-`。
- 写入策略：
  - 使用 `.part` 临时文件下载；按需 `append=true` 续传写入；完成后原子重命名为最终 `save` 路径。
  - 使用 `BufferedOutputStream` 与较大缓冲（如 1MB）提升顺序写入效率。
- 预检：
  - 若可获取 `content_length`，用 `Files.getFileStore(save.toPath()).getUsableSpace()` 校验可用空间，空间不足直接失败。
- 返回字段：
  - `save_path`（最终路径）、`tmp_path`（临时路径）、`bytes_written`、`content_length`（若可获取）、`resumed`（是否续传）。

## 改动位置
- `FileManagerHandler.java`：
  - 类头：新增 `@javax.annotation.Resource private OkHttpClient httpClient;`
  - `executeUploadFile`：
    - 参数解析处（原 `299-316`）：改为读取 `save` 字段并兼容 `path`，并统一构造最终保存路径与 `.part` 路径。
    - 文件存在逻辑（原 `317-326`）：不直接删除目标；采用 `.part` 临时文件，自动续传时保留并追加写入。
    - 下载逻辑（原 `330-352`）：使用派生客户端、`HEAD` 预检、`Range` 与 `Accept-Encoding: identity`；写入 `BufferedOutputStream`；成功后 `Files.move(.part → save)`。
    - 返回结构（原 `355-359`）：字段改为 `save_path`，并新增上述元数据。

## 验证方案
- 使用 ≥5GB 的公开文件进行下载；确认在首次下载与中断后恢复时均能完成。
- 检查 `bytes_written == content_length`；对比断点续传前后速度与稳定性。

## 兼容性
- 兼容旧入参：优先 `save`，空时回退读取 `path`；默认行为保持，无显式新参数。
- 不修改全局 OkHttp Bean，仅在本次调用派生客户端，避免影响其他 HTTP 调用。