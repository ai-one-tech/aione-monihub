## 目标
- 将 `apps/frontend/src/features/system/logs/request-logs.tsx` 的页面逻辑完整迁移到 `apps/frontend/src/features/system/logs/request.tsx`，保持接口参数、筛选项、导出、渲染完全一致，不改动业务逻辑与路由使用体验。

## 变更点
1. 页面实现迁移
- 用请求日志专用实现替换 `request.tsx` 现有内容：
  - 使用 `useLogsQuery` 并传入请求维度参数（包含 `log_type: 'request'`、`url`、`method`、`status` 等），与现状一致：`apps/frontend/src/features/system/logs/request-logs.tsx:17-25`
  - 继续使用 `logsApi.getExportUrl` 生成导出链接并透传：`apps/frontend/src/features/system/logs/request-logs.tsx:28-29,54-61`
  - 渲染组件改为 `RequestLogsTable`，保留分页、筛选、刷新等能力：`apps/frontend/src/features/system/logs/request-logs.tsx:54-61`
- 同时移除 `request.tsx` 中与系统日志视图相关的通用实现（`SystemLogsTable`、`DatePicker`、`requestLogsColumns`），避免冲突，保证行为与现页面一致：`apps/frontend/src/features/system/logs/request.tsx:6-11,55-83,102-108`

2. 路由指向统一
- 将路由组件导入改为从 `request.tsx` 拿 `RequestLogs`：
  - 现状：`apps/frontend/src/routes/_authenticated/logs/requests.tsx:4` 从 `request-logs` 导入
  - 调整为：从 `features/system/logs/request` 导入；`validateSearch` 保持不变：`apps/frontend/src/routes/_authenticated/logs/requests.tsx:6-13,16-18`

3. 代码清理（可选）
- 在功能验证通过后，删除已不再使用的 `request-logs.tsx`，避免重复代码与后续维护成本；如需保留以便回滚，可暂时保留文件但停止路由引用。

## 验证
- 前端不启动 dev，进行类型/构建检查以确保无 TS/构建错误（不触达业务逻辑）。
- 在 `/logs/requests` 路由下确认：分页、搜索（URL/方法/状态码/关键字）、导出链接、加载/错误态、刷新操作与当前行为一致。

## 交付
- 提交包含以上两个文件的更新（`request.tsx` 替换实现；路由导入更新），不更改接口、查询参数、表格交互与 UI 文案。