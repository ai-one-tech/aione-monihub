## 目标

* 修复“URL搜索没有效果”，保证按 URL 能服务端筛选生效。

* 中间件将完整记录：请求 headers、request body（仅 JSON，跳过文件）、response body（仅 JSON 与 text 跳过文件）、接口耗时、traceId，存入 `logs.context`（JSON）。

* 前端“请求日志”页面新增显示上述所有字段；内容较宽使用 `LongText` 组件以避免撑开表格。

## 后端改造

### 1) 修复 URL 搜索不生效

* 在 `apps/server/src/logs/handlers.rs:get_logs/export_logs` 的 URL 过滤中，新增对 `message LIKE %<url>%` 的过滤，确保即使数据库不支持 JSON 提取也能生效。

* 保留基于 `context.path` 的过滤（Postgres/支持 JSON 提取的场景），最终采用“二选一”的可靠过滤策略（优先 JSON，兜底 message LIKE）。

### 2) 中间件增强采集内容（存入 context JSON）

* 文件：`apps/server/src/logs/middleware.rs`

* headers：收集。

* request body：

  * 仅当 `Content-Type` 为 `application/json` 时读取并解析为 JSON；限制大小，例如上限 50KB，超过则截断并标注 `truncated: true`。

  * 若为 `multipart/form-data` 或 `application/octet-stream` 等文件类型，设置 `request_body: { skipped: true, reason: 'file' }`。

  * 注意：读取请求体后需重置 payload 以不影响后续 handler；将使用安全的复制策略并回填 payload（保证兼容 Actix Web）。

* response body：

  * 通过 `map_body` 捕获响应体，仅在 `Content-Type` 为 `application/json` 或 `text/*` 时保存；同样限制上限 8KB，必要时标注 `truncated: true`。

* 其它：`duration_ms`、`trace_id` 已存在，直接写入；将 `method/path/query/ip/user_agent/status` 保持与现有一致。

### 3) 接口响应增加字段

* 模型：`apps/server/src/logs/models.rs`

  * 扩展 `LogResponse` 字段：`method`, `path`, `status`, `request_headers`, `request_body`, `response_body`, `duration_ms`, `trace_id`。

* 映射：`apps/server/src/logs/handlers.rs`

  * 从 `log.context` 提取上述字段组装到响应，保持原有字段不变。

## 前端改造

### 1) 表格列与渲染

* 文件：`apps/frontend/src/features/system/logs/components/request-logs-table.tsx`

  * 新增列：`method/path(status 显示为数字)/request_headers/request_body/response_body/duration_ms/trace_id`。

  * 宽内容列（headers/body）使用现有 `LongText` 组件渲染，限制初始高度与宽度，支持展开查看，避免撑开表格。

  * 保留现有列：`timestamp/ip_address/user_agent/log_source/id`。

### 2) 筛选与搜索联动

* 过滤键：

  * `url` → 映射到 `path`（展示列为 `URL`，服务端按 `context.path` 或 `message LIKE` 过滤）。

  * `method` → 精确匹配（GET/POST/PUT/DELETE/PATCH）。

  * `status` → 精确匹配（数值）。

  * `keyword` → 模糊匹配 `message`。

* 保持与 `useTableUrlState` 同步，将新增列过滤映射到 URL 搜索参数。

## 校验

* 后端：在 `apps/server` 运行 `cargo check`，确保编译通过。

* 前端：页面 `/logs/requests` 检查 URL 搜索、方法与状态码筛选生效；宽内容列使用 `LongText` 显示不撑表格。

## 安全

* 敏感头部脱敏；请求/响应体设置大小上限，避免记录敏感或超大数据。

## 交付

* 我将按以上方案补丁实现，最少改动、遵循现有风格与 `apiClient` 调用规范，UI 保持 shadcn 风格，并完成一次性自检。

