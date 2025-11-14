## 目标
- 前后端统一使用 `config` 字段，弃用 `agent_config`。
- 前端在实例管理页新增右侧抽屉分组编辑配置，保存调用后端更新。
- 后端提供默认值：数据库无值时返回 Rust 模型的默认配置；更新时自动补全默认值。
- Agent 上报响应透传 `config`。

## 后端实现
- 新增 Rust 模型 `InstanceConfig/ReportConfig/TaskConfig/HttpConfig`，`#[serde(default)]` 保证默认值。
- `GET /api/instances/{id}`：若 `config` 为 `None`，返回默认配置对象。
- 新增 `PUT /api/instances/{id}/config`：接受部分字段，反序列化为 `InstanceConfig` 并补默认值后保存到 `instances.config`，返回合并后的完整配置。
- 统一命名与引用：实体字段为 `config: Option<Json>`；响应模型与上报模型字段统一为 `config`；上报处理器读取并透传 `instance.config`。

## 前端实现
- 新增抽屉组件 `instances-config-drawer.tsx`（shadcn Sheet），分组表单 Debug/Report/Task/HTTP，代理启用时显示并校验代理字段。
- 行操作中增加“配置”按钮，打开抽屉并调用 `getInstanceById(id)` 预填表单（数据库值或后端默认）。
- 新增 API `updateInstanceConfig(id, payload)`，统一通过 `apiClient.put('/api/instances/${id}/config', { config: payload })`。
- 提交成功后关闭抽屉并刷新实例详情，失败显示错误。

## 验证
- 后端使用 `cargo check` 验证路由/模型/实体一致。
- 前端保持使用 `apiClient`，组件风格与现有一致。