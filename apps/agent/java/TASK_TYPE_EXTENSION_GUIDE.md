# Java Agent 任务类型扩展指南

## 概述

Java Agent 提供了灵活的任务处理机制，可以轻松扩展支持新的任务类型。本文档说明如何为Java Agent添加新的任务处理器。

## 当前支持的任务类型

### 1. execute_command

- **类型标识**: `execute_command`
- **处理器**: `ExecuteCommandHandler`
- **功能**: 执行单条系统命令
- **参数**:
    - `command`: 要执行的命令字符串
    - `workdir`: 工作目录（可选）
    - `env`: 环境变量（可选）
    - `timeout_seconds`: 超时时间（可选）

### 2. shell_exec

- **类型标识**: `shell_exec`
- **处理器**: `ShellExecHandler`
- **功能**: 执行完整的shell脚本
- **参数**:
    - `script_content`: shell脚本内容
    - `workdir`: 工作目录（可选）
    - `env`: 环境变量（可选）
    - `timeout_seconds`: 超时时间（可选）

## 扩展新任务类型的步骤

### 步骤1: 创建任务处理器

1. 在 `org.aione.monihub.agent.handler` 包下创建新的处理器类
2. 实现 `TaskHandler` 接口
3. 实现 `execute` 和 `getTaskType` 方法

**示例模板**:

```java
package org.aione.monihub.agent.handler;

import org.aione.monihub.agent.model.TaskResult;
import org.aione.monihub.agent.util.AgentLogger;
import org.aione.monihub.agent.util.AgentLoggerFactory;

import java.util.Map;

public class MyNewTaskHandler implements TaskHandler {

    private AgentLogger log;
    private static final String TASK_TYPE = "my_new_task_type";

    @javax.annotation.PostConstruct
    public void init() {
        this.log = AgentLoggerFactory.getLogger(MyNewTaskHandler.class);
    }

    @Override
    public TaskResult execute(Map<String, Object> taskContent) throws Exception {
        // 实现任务执行逻辑
        log.info("Executing {} task", TASK_TYPE);

        // 解析任务参数
        String param1 = (String) taskContent.get("param1");
        Integer param2 = (Integer) taskContent.get("param2");

        // 执行任务逻辑
        // ...

        // 返回结果
        return TaskResult.success("Task completed successfully");
    }

    @Override
    public String getTaskType() {
        return TASK_TYPE;
    }
}
```

### 步骤2: 注册任务处理器

在 `AgentAutoConfiguration.java` 中添加新的Bean配置：

```java
@Bean
public MyNewTaskHandler myNewTaskHandler() {
    return new MyNewTaskHandler();
}
```

### 步骤3: 更新任务参数规范

1. 在服务端Rust代码中更新 `TaskType` 枚举
2. 在前端TypeScript类型定义中增加新的任务类型
3. 更新API文档

## 任务处理器设计规范

### 1. 输入参数

- 从 `taskContent` Map中获取参数
- 处理参数缺失和类型转换异常
- 提供合理的默认值

### 2. 错误处理

- 使用 `TaskResult.failure()` 返回错误结果
- 记录详细的错误日志
- 考虑超时和资源清理

### 3. 输出结果

- 使用 `TaskResult.success()` 返回成功结果
- 可以在 `resultData` 中返回结构化数据
- 包含执行耗时和详细状态信息

### 4. 资源管理

- 及时释放系统资源（文件句柄、进程等）
- 实现异常安全，确保资源清理
- 考虑并发执行时的资源隔离

## 扩展示例

### 文件上传任务处理器

```java
public class FileUploadHandler implements TaskHandler {
    // 实现文件上传逻辑
    // 参数: source_path, target_path, overwrite等
}
```

### 数据库查询任务处理器

```java
public class DatabaseQueryHandler implements TaskHandler {
    // 实现数据库查询逻辑
    // 参数: sql, connection_string, timeout等
}
```

### 服务部署任务处理器

```java
public class ServiceDeployHandler implements TaskHandler {
    // 实现服务部署逻辑
    // 参数: service_name, image_version, config等
}
```

## 测试新任务类型

### 1. 单元测试

```java
@Test
public void testMyNewTaskHandler() {
    MyNewTaskHandler handler = new MyNewTaskHandler();
    Map<String, Object> content = new HashMap<>();
    content.put("param1", "test");
    
    TaskResult result = handler.execute(content);
    assertTrue(result.getCode() == 0);
}
```

### 2. 集成测试

- 启动Agent服务
- 通过服务端下发测试任务
- 验证任务执行结果

## 最佳实践

1. **保持兼容性**: 新增任务类型不应影响现有功能
2. **详细的日志**: 记录足够的调试信息便于问题排查
3. **合理的超时**: 根据任务复杂度设置适当的超时时间
4. **资源限制**: 考虑内存、CPU、网络等资源限制
5. **错误恢复**: 实现重试和回滚机制

## 监控和调试

- 使用Agent的日志系统记录任务执行状态
- 监控任务队列长度和执行时间
- 设置告警机制检测异常任务
- 提供任务执行历史查询功能

通过遵循本指南，您可以轻松地为Java Agent扩展新的任务类型，满足各种业务场景的需求。