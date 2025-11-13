## 目标
- 在 `http://localhost:5173/logs/system` 实现“系统日志”页面，支持筛选：日志级别、日志内容、日志来源（后端/实例）、应用ID、实例ID；默认按创建时间降序展示。

## 后端确认与排序
- 路由：`apps/server/src/logs/routes.rs:4-6` 暴露 `GET /logs`、`GET /logs/export`
- 列表：`apps/server/src/logs/handlers.rs:8-112` 默认 `Column::Timestamp` 降序（与“创建时间降序”语义一致），支持参数：`page, limit, log_level, user_id, keyword, start_date, end_date, source, agent_instance_id`
- 类型：`apps/server/src/logs/models.rs:12-25,45-57,59-65`

## 路由与页面
- 新增：`apps/frontend/src/routes/_authenticated/logs/system.tsx`
  - `createFileRoute('/_authenticated/logs/system')`，URL 为 `/logs/system`
  - `zod` 校验 `search`：`page, pageSize, log_level, keyword, source, user_id, instance_id, agent_instance_id, start_date, end_date`

## 模块结构
- 路径：`apps/frontend/src/features/system/logs/`
  - `api/logs-api.ts`：封装 `/api/logs` 列表与 `/api/logs/export` 下载
  - `data/api-schema.ts`：`LogResponse、Pagination、LogListResponse、GetLogsParams`
  - `hooks/use-logs-query.ts`：`react-query` 数据获取
  - `components/system-logs-table.tsx`：表格、工具栏、分页
  - `index.tsx`：页面容器（标题、加载、错误、表格）

## 筛选与参数映射
- 日志级别：`log_level`（单选，预设 `DEBUG/INFO/WARN/ERROR`，值为字符串）
- 日志内容：`keyword`（文本，匹配后端 `message LIKE %keyword%`）
- 日志来源：
  - `source=backend`（后端日志，传 `source=backend`）
  - `instance`：使用 `agent_instance_id`（传 `agent_instance_id=<实例ID>`）
- 应用ID：`user_id`（后端以 `application_id` 存储，参数名为 `user_id`）
- 实例ID：
  - 首选 `agent_instance_id`（与后端过滤逻辑匹配）
  - 如需直传 `instance_id`，同时附带（后端当前未使用该字段，但向后兼容）
- 其他：日期范围 `start_date`/`end_date`（RFC3339）
- 分页：`page`、`limit`（由 URL `page/pageSize` 映射）

## 表格与UI
- 头部：标题“系统日志”，副标题说明
- 工具栏：复用 `components/data-table` 的 `DataTableToolbar`，配置：
  - 搜索框：绑定 `keyword`
  - 筛选：`log_level`（单选）、`source`（后端/实例）、`user_id`、`agent_instance_id`、日期范围
- 表格列：`timestamp, log_level, action(message), user_id, ip_address, user_agent, log_source, id`
- 排序：默认后端按 `timestamp` 降序；前端表格初始显示与后端一致（不做客户端再排序）
- 分页：`useTableUrlState + DataTablePagination`，`pageCount = ceil(pagination.total/limit)`
- 导出：按钮根据当前筛选生成 `GET /api/logs/export?...` 链接，使用 `<a href>` 或 `window.open` 触发下载（仍走代理）

## 代理与认证
- 所有请求走 `apiClient` 且以 `'/api'` 相对路径触发，`vite.config.ts` 代理到后端；`apiClient` 自动附带 `Authorization` 与 `cookie`。

## 代码位置
- 路由：`apps/frontend/src/routes/_authenticated/logs/system.tsx`
- 页面：`apps/frontend/src/features/system/logs/index.tsx`
- 表格：`apps/frontend/src/features/system/logs/components/system-logs-table.tsx`
- Hook：`apps/frontend/src/features/system/logs/hooks/use-logs-query.ts`
- API：`apps/frontend/src/features/system/logs/api/logs-api.ts`
- 类型：`apps/frontend/src/features/system/logs/data/api-schema.ts`

## 验收
- `/logs/system` 可访问
- 支持所列筛选并与后端参数一致
- 默认按创建/事件时间降序展示
- 导出为 CSV，内容与当前筛选一致
- UI 风格与现有系统页一致，使用项目内组件