## 目标
- 在 `instances` 表新增 JSON 配置字段，用于为单实例下发 `agent` 配置。
- 在 `POST /api/open/instances/report` 的响应中返回该配置，Agent 接收后更新本地并覆盖默认配置。

## 数据库变更
1. 新增列：`agent_config jsonb NULL`，带注释说明用途，添加必要索引（可选，若按实例筛选配置变化不需要额外索引）。
2. 迁移文件：`apps/server/migrations/007_add_agent_config.sql`，仅做增列与注释，不影响现有数据。
3. SeaORM 实体：在 `apps/server/src/entities/instances.rs` 中增加 `pub agent_config: Option<Json>` 字段并参与序列化（参考现有 `custom_fields`）。

## 后端 API 调整
1. 上报响应模型：在 `apps/server/src/instance_reports/models.rs` 的 `InstanceReportResponse` 中新增字段：
   - `agent_config: Option<serde_json::Value>`（保持可选，后端无配置时不下发）。
2. 上报处理器：在 `apps/server/src/instance_reports/handlers.rs` 的 `report_instance_info`（apps/server/src/instance_reports/handlers.rs:21）中：
   - 完成入库与实例更新后，从实例实体读取 `agent_config`；
   - 构建响应时赋值到 `InstanceReportResponse.agent_config`（apps/server/src/instance_reports/handlers.rs:235-246 附近）。
3. 其它实例响应：可同步在 `apps/server/src/instances/models.rs` 的 `InstanceResponse` 中新增 `agent_config` 字段并从实体映射，便于管理端查看（非必需，本次可选）。

## Agent 改造（Java）
1. 响应 DTO：新增 `InstanceReportResponse` Java 模型，包含 `status`、`message`、`record_id`、`timestamp`、`log_success_count`、`log_failure_count`、`agent_config`（`JsonNode` 或 `Map<String,Object>`）。
2. 解析响应：在 `apps/agent/java/src/main/java/org/aione/monihub/agent/service/InstanceReportService.java` 的 `sendReport`（apps/agent/java/src/main/java/org/aione/monihub/agent/service/InstanceReportService.java:214）中：
   - `response.isSuccessful()` 时读取 `response.body().string()`，反序列化到响应 DTO；
   - 若存在 `agent_config`：
     - 写入本地：扩展 `LocalConfig` 增加 `agentConfig` 字段（`JsonNode`），并用 `LocalConfigUtil.updateConfig(...)` 持久化；
     - 运行时覆盖：新增 `AgentConfigOverrideApplier`，将服务端配置应用到 `AgentConfig` bean（如 `report.intervalSeconds`、`task.pollIntervalSeconds`、`debug` 等）。
3. 覆盖细则：以“服务端配置优先”合并到当前 `properties`，无对应键不变；类型严格校验，非法值忽略且记录日志。
4. 生效策略：
   - 立即生效项：对定时器敏感的参数（如 `report.intervalSeconds`），收到新值后重启 `scheduler` 以应用；
   - 非立即项：其余参数更新到内存并持久化，重启后沿用。

## 数据结构约定
- 字段名：`agent_config` 为自由 JSON，建议按 `monihub.agent` 结构组织，示例：
```json
{
  "serverUrl": "http://srv:9080",
  "debug": true,
  "report": { "enabled": true, "intervalSeconds": 30 },
  "task": { "enabled": true, "pollIntervalSeconds": 20, "longPollEnabled": true },
  "file": { "uploadDir": "/data/uploads", "maxUploadSizeMb": 200 }
}
```
- 兼容策略：缺省或空 JSON 不影响现有逻辑；仅识别已支持键，其它键原样存储但不应用。

## 兼容与回滚
- 迁移为向后兼容增列；回滚仅需 `ALTER TABLE ... DROP COLUMN agent_config`。
- 响应新增字段为可选；Agent 端无该字段时保持当前行为。

## 校验点
- 后端：
  - 构建与返回 `agent_config` 正确（`report_instance_info` 路径返回含配置 JSON）。
  - 数据库读写不影响现有上报、分页与日志入库。
- Agent：
  - 收到响应后正确解析并持久化本地配置（`/tmp/monihub/config`）。
  - 关键参数变更能即时或下次重启后生效；异常值不导致崩溃。

## 后续可选（非本次必须）
- 恢复/新增实例更新接口以支持通过管理端设置 `agent_config`；前端表单复用现有 shadcn 风格组件并校验 JSON。
- 为 `agent_config` 增加版本号与变更时间，便于 Agent 端做幂等处理。