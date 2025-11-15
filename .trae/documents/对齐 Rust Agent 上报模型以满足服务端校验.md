## 关键约束

* 保留当前“长连接长轮询”语义：当长轮询因 `SocketTimeoutException` 超时返回时，应立即重新发起连接，不做等待。

## 严重逻辑问题（在上述约束下）

* 禁用时的热循环：任务关闭或配置禁用场景下仍持续无等待循环检查，CPU 占用高且无收益（apps/agent/java/src/main/java/org/aione/monihub/agent/service/InstanceTaskService.java:106-116）。

* 双线程池阻塞叠加：`taskDispatcher` + `AgentTaskExecutor` 双池且外层线程长时间阻塞等待，复杂且浪费资源（apps/agent/java/src/main/java/org/aione/monihub/agent/service/InstanceTaskService.java:170-193; apps/agent/java/src/main/java/org/aione/monihub/agent/executor/AgentTaskExecutor.java:90-105）。

* 停止与中断语义不一致：发生中断时未统一恢复中断标志与快速退出（apps/agent/java/src/main/java/org/aione/monihub/agent/service/InstanceTaskService.java:156-161）。

* URL 构建不规范：字符串拼接未编码、可读性差（apps/agent/java/src/main/java/org/aione/monihub/agent/service/InstanceTaskService.java:118-126, 219-228）。

## 改造思路

* 保持“超时立即重连”不变；仅在“禁用/配置缺失/非超时错误”时加入轻量退避，避免热循环。

* 移除 `taskDispatcher`，以 `AgentTaskExecutor` 的线程池为唯一执行池，并提供异步接口；完成后再异步提交结果，不阻塞执行线程。

* 统一中断处理与停止流程，使长轮询线程在停止时可预期退出。

* 规范 URL 构建，提升健壮性与可读性。

## 实施步骤

1. 轮询控制逻辑

* 将 `pollTasks()` 拆为 `pollOnce()`，返回枚举结果：`TIMEOUT`（立即重连）、`TASKS_PROCESSED`（立即重连）、`DISABLED`（sleep 1-2s）、`NO_TASKS`（通常由长轮询返回，仍可立即重连）、`ERROR_NON_TIMEOUT`（sleep 2-5s）。

* 保留单线程循环，但在每次循环根据结果选择 `Thread.sleep(x)`；在 `SocketTimeoutException` 时绝不 sleep，立即继续。

1. 精简执行模型

* 在 `AgentTaskExecutor` 增加异步接口：`Future<TaskExecutionResult> submit(TaskDispatchItem)` 或 `CompletableFuture<TaskExecutionResult> executeAsync(...)`；内部沿用现有线程池与超时控制。

* 在 `InstanceTaskService.processTask(...)` 改为调用异步接口，并在完成回调中执行 `submitResult(...)`；删除 `taskDispatcher`。

1. 异步提交结果与重试

* 将当前阻塞式重试改为异步定时重试；退避策略简化为 1s, 2s, 4s, 8s, 16s（合计 < 31s），达到上限记录错误。

1. URL 规范化

* 使用 `HttpUrl.Builder` 构建轮询与回传 URL（编码 `agent_instance_id`、`wait`、`timeout` 等参数）。

1. 中断与停止

* 在所有 `sleep`/阻塞处捕获 `InterruptedException` 后调用 `Thread.currentThread().interrupt()` 并退出当前循环；`stop()` 先置 `running=false`，再关闭执行与调度资源。

## 验证与预期

* 模拟长轮询超时：立即重连，日志符合预期，CPU 占用平稳。

* 禁用场景：CPU 占用明显下降（有轻量 sleep），配置重新启用后迅速恢复连接。

* 高并发任务：执行线程池稳定，回传异步不阻塞；停止应用时能在短时间内优雅退出。

