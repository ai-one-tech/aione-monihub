## 前端改造
- 位置：`apps/frontend/src/features/application-tasks/index.tsx`
- 将原 `h3` 标题“执行结果”替换为 `Tabs`（`@/components/ui/tabs`）：
  - `TabsList` 内两个 `TabsTrigger`：`value='result'` 文案“执行结果”、`value='files'` 文案“文件夹”。
  - `TabsContent value='result'`：保留现有内容与交互（包括重试按钮、状态展示、复制逻辑等），不改动现有渲染与数据来源。
  - `TabsContent value='files'`：新增“文件夹”视图，展示当前所选任务 + 实例关联的文件列表。
- 新增前端 API 调用（仅用 `apiClient`）：
  - 在前端增加文件查询封装：`filesApi.getFiles({ task_id, instance_id, order_by: 'uploaded_at', order: 'asc' })`，内部使用 `apiClient.get('/api/files?...')`。
  - 查询 Key：`['task-files', taskId, instanceId]`；在“文件夹”页签内用 `useQuery` 获取数据，`enabled: !!(taskId && instanceId)`。
- 列表展示与下载：
  - 使用 `Card`（`@/components/ui/card`）作为文件项卡片，显示：
    - 文件标题：后端字段 `file_name`
    - 文件大小：后端字段 `file_size`（友好单位格式化）
    - 上传完成时间：后端字段 `uploaded_at`（本地时间格式化）
  - 右下角放置“下载”按钮：点击后调用 `apiClient` 的下载方法获取 `Blob` 并触发保存。
  - 无实例选择时在“文件夹”页签内显示提示：`请先选择实例以查看关联文件`。
- 下载实现（满足“所有 API 使用 apiClient”）：
  - 为 `apiClient` 增加 `download(endpoint: string, options?)` 方法：认证与超时沿用现有逻辑，成功分支用 `response.blob()`，从 `Content-Disposition` 解析文件名；业务侧创建 `ObjectURL` 触发浏览器保存。
  - 下载端点：`GET /api/files/download/{file_id}`。

## 后端新增接口
- 位置：Rust 服务 `apps/server/src/files/` 模块（遵循现有上传/下载的路由结构）。
- 新增列表查询端点：`GET /api/files`
  - 查询参数：`task_id`（必填）、`instance_id`（必填）、`order_by='uploaded_at'`（可选，默认）、`order='asc'`（可选，默认）。
  - 语义：根据 `task_id` 与 `instance_id` 组合筛选文件，按 `uploaded_at` 升序返回。
- 实现要点（SeaORM）：
  - 表/模型：`entities::files::Entity`；过滤 `files::Column::TaskId.eq(task_id)` 与 `files::Column::InstanceId.eq(instance_id)`。
  - 排序：`order_by(files::Column::UploadedAt, Order::Asc)`。
  - 返回字段：`id, file_name, file_size, uploaded_at`（以及前端可能需要的 `file_path/file_extension`）。
  - 响应结构建议：`{ data: FileItem[] }`，其中 `FileItem = { id, file_name, file_size, uploaded_at }`。
- 路由挂载：在 `apps/server/src/files/routes.rs` 现有 `scope("/api/files")` 下追加 `.route("", web::get().to(get_files))`。
- 兼容下载：沿用已存在的 `GET /api/files/download/{file_id}` 处理器。

## 集成与校验
- 前端：
  - 保持“执行结果”页签逻辑与样式完全不变，确保现有自动刷新、状态展示与复制能力正常。
  - 在“文件夹”页签中：
    - 当选择了任务与实例后，加载并展示文件卡片列表；排序为上传时间升序。
    - 点击下载按钮，成功触发浏览器保存文件；认证通过 `apiClient` 自动携带。
- 后端：
  - 本地编译校验：`cargo check` / `cargo build`（不运行服务）。
  - 数据库查询正确过滤与排序；返回 JSON 结构与前端期望一致。

## 交互与兼容
- 无实例选择时的 UX：显示提示占位，不触发查询。
- 错误与空态：
  - 查询失败显示错误提示卡片；
  - 列表为空显示“未找到关联文件”。
- 移动端：`TabsList` 外层加 `overflow-x-auto`，卡片栅格自适应。

如确认方案，我将按以上步骤修改前后端代码，确保首个页签“执行结果”保持原样，新增“文件夹”页签完成文件列表与下载功能。