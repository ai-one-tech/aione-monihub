## 目标概述

* 在“应用任务”页面新增任务类型 `http_request`，支持常见 HTTP 请求及文件上传。

* 服务端沿用现有任务下发与记录机制，仅新增任务类型枚举值和内容结构，无需变更接口契约。

* Java 与 Rust Agent各自新增处理器，使用既有 HTTP 客户端（OkHttp/reqwest），agentConfig 中的 HTTP 代理配置。

## 前端改造（apps/frontend）

* 位置：`apps/frontend/src/features/application-tasks/index.tsx`

* 改动点：

  * 在任务类型单选组新增“HTTP 请求”项，值为 `http_request`，与服务端/Agent 枚举一致。

  * 选择后显示“设置详细参数”按钮，点击在右侧以 Drawer/Sheet 弹层展示详细参数表单。

  * 表单要素：

    * 基本：`method`(GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS)、`url`、`timeout_seconds`、`allow_redirects`、`verify_tls`。

    * 查询与头：`query`(键值对)、`headers`(键值对)。

    * 请求体：`body_type`(none/json/form/multipart/raw)。

      * json：`json_body`(文本/JSON编辑)。

      * form：`form_fields`(键值对)。

      * raw：`raw_body`(文本) 与 `content_type 前端默认填充常见的 content-type`。

      * multipart：`parts` 数组；支持：

        * 字段部件：`{ type: 'field', name, value }`

        * 文件部件：`{ type: 'file', name, file_path, filename?, content_type? }`（说明 file\_path 为 Agent 本机路径）

    * 代理： 默认走 agentConfig。

  * 保存后在“创建任务”卡片内展示概览：方法/URL、头部数、查询键数、体类型与部件数、超时与代理信息。

  * 下发任务沿用当前逻辑，构造 `task_content` 为上述 JSON，`task_type`= `http_request`；任务历史与结果展示保持现状。

  * 校验：必填 `method`、`url`；当 `body_type` 为 multipart 时校验文件部件 `file_path` 存在；数字范围与布尔值校验用 zod。

* 参考代码：任务页与派发逻辑见 `apps/frontend/src/features/application-tasks/index.tsx:519`、接口封装见 `apps/frontend/src/features/applications/api/applications-api.ts:82`。

## 服务端契约与枚举（apps/server）

* 新增 `TaskType::HttpRequest`（序列化为 `http_request`）。位置：`apps/server/src/shared/enums.rs:54`。

* 任务创建与下发接口无需改动，`task_content` 透传；下发项结构保持 `task_content` 字段（参考 `apps/server/src/instance_tasks/models.rs:203-210`）。

## Java Agent 实现（apps/agent/java）

* 新增处理器 `HttpRequestHandler`（实现 `TaskHandler`），`getTaskType()` 返回 `TaskType.http_request`。

* 参数解析与校验：

  * 必填：`method`、`url`；可选：`headers`、`query`、`timeout_seconds`、`allow_redirects`、`verify_tls`、`proxy_override`。

  * 体：根据 `body_type` 选择 OkHttp 的 `RequestBody`（JSON/Form/Multipart/Raw）。

  * multipart 文件：读取 `file_path`，以 `MultipartBody` 添加文件；支持 `filename` 与 `content_type`。

* 代理遵循 agentConfig：

  * 读取 `AgentConfig#getHttp()` 的 `proxyEnabled/host/port/username/password`（参考 `apps/agent/java/src/main/java/org/aione/monihub/agent/config/InstanceConfig.java:29-50`）。

  * 在 OkHttpClient 构建时配置 `Proxy` 与 `proxyAuthenticator`；若请求携带 `proxy_override`，为当前请求派生 `client.newBuilder()` 覆盖。

  * 代理的修改 值影响 http\_request 的任务，不要影响其他使用 okhttp的场景

* 超时与重定向：

  * 依据任务 `timeout_seconds` 为该请求 `client.newBuilder().readTimeout(...).writeTimeout(...).build()`；`followRedirects` 按参数控制。

* 结果回填：

  * `result_data` 包含：`status`、`headers`(简化为 map)、`body`（字符串，限制最大长度如 5MB，超出则截断并标注）、`elapsed_ms`。

  * 错误统一填充 `error_message`，状态置为 `failed/timeout`。

* 注册处理器：在 `AgentAutoConfiguration` 中 `@Bean` 暴露，并由 `AgentTaskExecutor` 自动注册（参考 `apps/agent/java/src/main/java/org/aione/monihub/agent/executor/AgentTaskExecutor.java:63-68`）。

* 现有 OkHttpClient：在 `AgentAutoConfiguration.okHttpClient` 中按代理与长轮询超时调整（参考 `apps/agent/java/src/main/java/org/aione/monihub/agent/config/AgentAutoConfiguration.java:43-53`）。

## Rust Agent 实现（apps/agent/rust）

* 扩展枚举：在 `models.rs` 增加 `HttpRequest` 变体（序列化为 `http_request`）（参考 `apps/agent/rust/src/models.rs:40`）。

* 新增处理器模块 `handlers/http_request.rs`：

  * 解析 `item.content`/`item.task_content`（为兼容同时尝试两个键）为与前端一致的结构。

  * 使用 `reqwest::Client` 构造请求（method/url/headers/query/body），支持 multipart 文件读取并附加。

  * 代理：在 `Config` 增加 `http` 段（`proxy_enabled`、`proxy_url`、`proxy_username/password`），在创建 Client 时用 `reqwest::Proxy` 与 `ClientBuilder::proxy` 配置；若存在 `proxy_override` 优先覆盖。

  * 超时、重定向、TLS：用 `ClientBuilder::timeout`、`redirect::Policy`、`danger_accept_invalid_certs`（仅当 verify\_tls=false）。

  * 结果：返回 `serde_json::json!` 包含 `status`、`headers`、`body`（限制大小）、`elapsed_ms`。

* 任务分发映射：在 `services/tasks.rs` 的 `handle_task` 中为 `TaskType::HttpRequest` 调用新处理器（参考 `apps/agent/rust/src/services/tasks.rs:30`）。

## 任务内容 Schema（统一约定）

* 基本：

  * `method`: string

  * `url`: string

  * `timeout_seconds`: number? 默认60s

  * `allow_redirects`: boolean? 默认 false

  * `verify_tls`: boolean?（默认 false）

* 头与查询：

  * `headers`: Record\<string,string>?

  * `query`: Record\<string,string|number|boolean>?

* 体：

  * `body_type`: 'none'|'json'|'form'|'multipart'|'raw'

  * `json_body`: any?

  * `form_fields`: Record\<string,string>?

  * `raw_body`: string?

  * `content_type`: string?（raw 时）

  * `parts`: Array<{ type: 'field'|'file', name: string, value?: string, file\_path?: string, filename?: string, content\_type?: string }>

## 参数校验与安全

* 前端用 zod 校验必填与类型；Agent 再次做严格校验并给出错误信息。

* 限制响应体读取大小（如 5MB），避免内存风险；支持 `content-type` 判定仅字符串显示。

* 文件路径必须为可读的本机路径；拒绝目录遍历与非法路径。

* 代理凭据仅用于代理认证，不落盘；不在日志中打印敏感信息。

## 结果展示

* 前端执行结果面板对 `http_request` 显示：HTTP 状态码、头部若干、响应体预览（自动截断）、耗时；保持与现有格式一致。

## 兼容性与补充

* 服务器下发项字段：建议同时包含 `task_content` 与 `content` 两键以兼容 Rust 旧结构；或在 Rust 端为字段添加 `#[serde(rename = "task_content")]`。

* 前端的另一套任务表单（`features/applications/components/applications-task-form.tsx`）暂不改动，主改动集中于“应用任务”页面。

## 验证与交付

* 前端：创建 `http_request` 任务、任务历史可见、实例结果正确更新；

* Java/Rust：本地联调到测试 API（含 multipart），代理启用/禁用切换；长响应与超时场景验证；

* 日志：在 Agent 端输出关键步骤日志，不含敏感信息。

如需我直接按此方案落地代码，请确认。
