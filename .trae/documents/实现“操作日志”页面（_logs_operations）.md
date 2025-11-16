## 目标
- 新增“操作日志”页面，路径 `/logs/operations`，展示系统内所有数据的新增/更新/删除（CRUD）记录。
- 默认表格列：操作用户、操作时间、操作IP、TraceID、操作的表、操作类型（新增/删除/更新）。
- 支持筛选：操作用户、操作时间（范围）、操作IP、TraceID、操作的表、操作类型。
- 点击“查看详情”可查看操作前后数据与字段级别差异（JSON）。

## 数据模型与接口
- 复用后端 `logs` 表，新增审计日志（`log_source='audit'`），在 `context(json)` 中结构化保存：
  - `table`: string（如 `users`、`roles`、`permissions`、`applications` 等）
  - `operation`: `create|update|delete`
  - `user_id`: string（操作者ID）
  - `ip`: string
  - `trace_id`: string
  - `before`: object|null（删除/更新时存在）
  - `after`: object|null（新增/更新时存在）
  - `diff`: array<{ path: string, type: 'added'|'removed'|'changed', before?: any, after?: any }>
- 新增接口：
  - `GET /api/audit/logs`：分页列表，过滤参数：`page, limit, user, ip, trace_id, table, operation, start_date, end_date`
  - `GET /api/audit/logs/{id}`：单条详情（含 `before/after/diff` 全量）
- 返回结构（简化）：
  - 列表项：`{ id, user, timestamp, ip, trace_id, table, operation }`
  - 详情项：在上面基础上追加 `before, after, diff`

## 后端实现（Rust + SeaORM）
- 审计记录写入：在各业务的写操作路径（`insert`/`update`/`delete`）调用通用审计函数：
  - 输入：`table, operation, user_id, ip, trace_id, before?, after?`
  - 处理：计算 `diff`（递归对比 `serde_json::Value`，生成字段级差异），写入 `logs`：
    - `log_level='info'`、`log_source='audit'`、`message='AUDIT <TABLE> <OP> id=<...>'`
    - `context` 存储上述结构字段
- 列表接口：基于 `logs` 查询，`filter log_source='audit'`，从 `context` 中提取过滤字段：
  - `table`：`(context->>'table') = ?`
  - `operation`：`(context->>'operation') = ?`
  - `user/ip/trace_id`：`(context->>'user_id'/'ip'/'trace_id') = ?`
  - 时间范围：`timestamp BETWEEN ? AND ?`
- 详情接口：按 `id` 读取 `logs`，返回 `context.before/after/diff`。
- 差异计算：不引入额外依赖，递归比较：
  - 键新增→`added`；键删除→`removed`；值变化→`changed`；嵌套路径用 `a.b.c` 表示。

## 前端实现（React + TanStack Table）
- 路由：新增 `apps/frontend/src/routes/_authenticated/logs/operations.tsx`，挂载到 `/logs/operations`。
- API 封装：`apps/frontend/src/features/system/logs/operations/api/operations-logs-api.ts`，统一使用 `apiClient`：
  - `getOperationLogs(params)` → `GET /api/audit/logs`
  - `getOperationLogDetail(id)` → `GET /api/audit/logs/{id}`
- 数据类型：`OperationLogResponse`（列表项）与 `OperationLogDetail`（详情项）。
- 页面组件：
  - `operations-logs-table.tsx`：表格列对应需求字段；分页与筛选复用 `useTableUrlState`；工具栏复用 `DataTableToolbar`，筛选项：
    - 操作用户（string）
    - 操作类型（单选：新增/更新/删除）
    - 操作的表（string，支持下拉或文本，先文本）
    - 操作IP（string）
    - TraceID（string）
    - 时间范围（起止 RFC3339 字符串，工具栏增加区段控件或以两个输入框实现）
  - `operation-log-detail-dialog.tsx`：详情弹窗，显示：
    - 基本信息（用户、时间、IP、TraceID、表、类型）
    - `before` 与 `after`：采用现有 `CodeEditor` 或 `<pre>` 美化展示
    - `diff`：以 JSON 列表展示；后续可扩展为更直观高亮
- 交互：列表只拉取概要；打开详情时按需请求 `GET /api/audit/logs/{id}`。
- 组件风格：复用现有 shadcn 风格的 `Table`、`DataTableToolbar`、`DataTablePagination`；不重复封装。

## URL 状态与筛选
- 使用 `useTableUrlState`：
  - `columnFilters` 映射：`user → 'user'`、`ip → 'ip'`、`trace_id → 'trace_id'`、`table → 'table'`、`operation → 'operation'`
  - 全局搜索关闭或保留为 `trace_id` 专用；时间范围用独立查询键：`start_date`、`end_date`

## 验证与交付
- 后端：本地构建 `cargo check && cargo build`；确认新路由注册与过滤逻辑正确。
- 前端：运行开发代理查看页面渲染与筛选行为；不执行 `npm run dev`（遵循项目规则）。
- 数据：在任一写操作触发后应产生审计日志；页面列表能展示；详情可查看 `before/after/diff`。

## 影响与兼容
- 兼容现有 `logs` 表与查询；新增审计专用接口，避免破坏现有系统日志查询。
- 初期只对核心实体接入审计（用户/角色/权限/应用/实例等）；后续可逐步覆盖全部写路径。
- 导出功能暂不实现（可后续补充），本次聚焦查询与详情。