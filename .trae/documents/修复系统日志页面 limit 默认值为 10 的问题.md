## 问题定位
- 系统日志页面未显式传递 `limit` 时，后端使用默认 `10`（apps/server/src/logs/handlers.rs:16）。
- 前端系统日志页 `index.tsx` 将 `limit` 设为 `search.pageSize || 10`（apps/frontend/src/features/system/logs/index.tsx:18），当路由未携带 `pageSize` 或尚未同步到搜索参数时会落到 `10`。
- 同文件的总页数计算也使用了 `search.pageSize || 10`（apps/frontend/src/features/system/logs/index.tsx:57），导致分页不一致。
- 对比：请求日志页已正确使用 `search.pageSize ?? DEFAULT_PAGE_SIZE`（apps/frontend/src/features/system/logs/request-logs.tsx:19）。
- 表格默认页大小为 `20`（apps/frontend/src/features/system/logs/components/system-logs-table.tsx:78），与上述回退值不一致。

## 修改方案
- 在系统日志页 `index.tsx` 引入 `DEFAULT_PAGE`, `DEFAULT_PAGE_SIZE`，统一回退逻辑为环境默认。
- 将：
  - `page: search.page || 1` 改为 `page: search.page ?? DEFAULT_PAGE`
  - `limit: search.pageSize || 10` 改为 `limit: search.pageSize ?? DEFAULT_PAGE_SIZE`
  - `totalPages` 分母的回退 `search.pageSize || 10` 改为 `search.pageSize ?? DEFAULT_PAGE_SIZE`
- 不新增文件，保持与请求日志页的实现一致，避免双标和隐性魔法数。

## 影响范围
- 仅影响系统日志页面的列表数量与分页计算，使默认页大小与全局配置保持一致（默认 20）。
- API 参数将稳定包含 `limit=20`（或自定义环境值），后端不再回落到 10。

## 验证步骤
- 刷新系统日志页，观察网络请求：应包含 `.../api/logs?limit=20&page=1&log_type=system`。
- UI 每页显示 20 条；分页总页数为 `total / 20`（apps/frontend/src/features/system/logs/index.tsx:57 更新后）。
- 切换页大小（分页组件），URL `pageSize` 更新同步，后续请求按新值传递。

## 代码引用
- 默认 10 的后端回退：apps/server/src/logs/handlers.rs:16
- 系统日志页错误回退：apps/frontend/src/features/system/logs/index.tsx:18, 57
- 正确实现示例：apps/frontend/src/features/system/logs/request-logs.tsx:19
- 表格默认页大小：apps/frontend/src/features/system/logs/components/system-logs-table.tsx:78