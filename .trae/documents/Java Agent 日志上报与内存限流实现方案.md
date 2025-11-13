## 目标
- 在 Java Agent 中为 `AgentLogger` 增加“日志内存副本”与限流（最多保留 1000 条，可配置）。
- 在每次实例上报 `instances/report` 时携带“未发送的日志”。
- 服务端返回成功则删除本地已发送日志，失败则保留以便下次继续上报。

## 关键改动
- 新增 `AgentLogStore`（线程安全、环形缓冲）：集中管理内存中的日志、批量获取与删除。
- 扩展 `AgentLogger`：在现有输出的同时写入 `AgentLogStore`（遵循当前 debug/info 的开关语义，warn/error 始终入库）。
- 在 `InstanceReportService` 构建上报体时填充日志，并在发送成功后删除已发送日志。
- 在 `AgentConfig.ReportConfig` 增加 `maxLogRetention` 配置项，默认 1000。

## 设计与实现细节
- 日志数据结构：沿用已存在的 `AgentLogItem`（apps/agent/java/src/main/java/org/aione/monihub/agent/model/AgentLogItem.java:1），字段包含 `log_level`、`message`、`context`、`timestamp`。
- 内存缓冲：`AgentLogStore` 使用线程安全的双端队列维护“待发送日志”，写入时若超出 `maxLogRetention` 则丢弃队首的最旧日志，确保只保留最新 N 条。
- 取数与删除：
  - 构建上报时调用 `AgentLogStore.snapshotPending()` 返回当前“未发送日志”的快照（List）。
  - 发送成功后调用 `AgentLogStore.removeSent(count)` 按快照条数从队首删除，失败不删除。
- `AgentLogger` 与现有语义保持一致：
  - debug/info：仅在 `properties.isDebug()` 为真时输出并入库（与当前实现一致，参考 apps/agent/java/src/main/java/org/aione/monihub/agent/util/AgentLogger.java:22,49）。
  - warn/error：始终输出并入库（参考 apps/agent/java/src/main/java/org/aione/monihub/agent/util/AgentLogger.java:76,100）。
  - 文本格式化：使用 SLF4J 的 `MessageFormatter` 生成最终 message，context 可留空或仅记录异常摘要。

## 修改点（含代码定位）
- InstanceReportService：
  - 在“构建上报请求”阶段填充日志：在 `apps/agent/java/src/main/java/org/aione/monihub/agent/service/InstanceReportService.java:206` 处实现 `request.setAgentLogs(AgentLogStore.snapshotPending())`。
  - 在“发送成功后”删除日志：在 `apps/agent/java/src/main/java/org/aione/monihub/agent/service/InstanceReportService.java:228-232` 的成功分支中调用 `AgentLogStore.removeSent(request.getAgentLogs() == null ? 0 : request.getAgentLogs().size())`。
- AgentLogger：在所有输出方法中追加写入 `AgentLogStore.append(...)`（遵循当前开关逻辑）。文件：`apps/agent/java/src/main/java/org/aione/monihub/agent/util/AgentLogger.java`。
- AgentLogStore：新增文件 `apps/agent/java/src/main/java/org/aione/monihub/agent/util/AgentLogStore.java`，提供：
  - `append(LogLevel level, String message, Map<String,Object> context)`
  - `List<AgentLogItem> snapshotPending()`
  - `void removeSent(int count)`
  - 通过 `SpringContextUtils.getBean(AgentConfig.class).getReport().getMaxLogRetention()` 读取限流参数。
- AgentConfig：在内部类 `ReportConfig` 增加字段 `private int maxLogRetention = 1000;`（apps/agent/java/src/main/java/org/aione/monihub/agent/config/AgentConfig.java:80-91）。

## 上报流程（串联）
- 构建请求：`buildReportRequest()` 收集系统/网络/硬件/运行时信息，并附加 `agent_logs`（参考 apps/agent/java/src/main/java/org/aione/monihub/agent/service/InstanceReportService.java:142-210）。
- 发送请求：`sendReport()` POST 到 `serverUrl + "/api/open/instances/report"`（参考 apps/agent/java/src/main/java/org/aione/monihub/agent/service/InstanceReportService.java:215-247）。
- 处理结果：成功→删除已发送日志；403→保持日志并执行禁用 HTTP；其它失败→保持日志并告警。

## 并发与性能
- 采用队列 + 简单批处理，写入与读取使用锁保护，开销极小。
- 丢弃策略为“丢弃最旧”，确保近期问题能上报。
- 日志仅在内存中维护，不做磁盘持久化，满足轻量与安全要求。

## 验证方案
- 启动 Agent 并触发多次日志输出（debug 打开/关闭两种）。
- 观察上报体中 `agent_logs` 的条数与内容随周期变化；服务端返回成功后本地条数相应减少；返回失败时条数保持不变。
- 通过调整 `monihub.agent.report.max-log-retention`（或直接使用默认 1000）验证限流行为。