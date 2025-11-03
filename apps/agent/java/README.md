# AiOne MoniHub Java Agent

## 简介

Java Agent 用于向 AiOne MoniHub 服务端上报实例运行状态和硬件信息，并接收和执行服务端下发的任务。

## 功能特性

### ✅ 已实现功能

1. **数据采集模块**
   - 系统信息采集（OS类型、版本、主机名）
   - 网络信息采集（内网IP、公网IP、MAC地址、网络类型）
   - 硬件资源采集（CPU、内存、磁盘使用率）
   - 运行时信息采集（进程ID、运行时长、线程数）

2. **自动上报服务**
   - 定时采集并上报实例信息
   - 支持配置上报间隔
   - 自动重试机制
   - 失败计数和告警

3. **Spring Boot 集成**
   - 自动配置支持
   - 配置属性绑定
   - 应用启动时自动启动Agent

### 🔄 待完善功能

4. **任务拉取与执行**（框架已就绪，待实现具体执行器）
   - 长轮询任务拉取
   - Shell命令执行
   - 文件操作（上传、下载、浏览、查看、删除）
   - 内部命令执行

5. **结果回传**
   - 本地缓存机制
   - 重试逻辑（3次，5s/10s/30s间隔）
   - 确认后删除缓存

## 快速开始

### 1. 环境要求

- JDK 1.8+
- Maven 3.6+
- 可访问的 AiOne MoniHub 服务端

### 2. 构建项目

```bash
cd apps/agent/java
mvn clean package
```

### 3. 配置

编辑 `src/main/resources/application.yml`：

```yaml
monihub:
  agent:
    instance-id: your-instance-id  # 必填！先在服务端创建实例
    server-url: http://localhost:9080
    report:
      enabled: true
      interval-seconds: 60
```

### 4. 运行

```bash
java -jar target/aione-monihub-agent-java-0.1.0.jar
```

或使用Maven：

```bash
mvn spring-boot:run
```

### 5. 集成到Spring Boot应用

#### 添加依赖

在您的Spring Boot项目的 `pom.xml` 中添加：

```xml
<dependency>
    <groupId>tech.aione</groupId>
    <artifactId>aione-monihub-agent-java</artifactId>
    <version>0.1.0</version>
</dependency>
```

#### 配置

在 `application.yml` 中添加配置：

```yaml
monihub:
  agent:
    instance-id: ${INSTANCE_ID}
    server-url: ${MONIHUB_SERVER_URL:http://localhost:9080}
```

#### 自动启动

Agent会在应用启动后自动开始工作，无需额外代码。

## 核心组件说明

### 数据采集器

| 组件 | 类名 | 功能 |
|------|------|------|
| 系统信息 | `SystemInfoCollector` | 采集OS类型、版本、主机名 |
| 网络信息 | `NetworkInfoCollector` | 采集IP、MAC、网络类型（含公网IP缓存） |
| 硬件资源 | `HardwareInfoCollector` | 采集CPU、内存、磁盘使用率 |
| 运行时信息 | `RuntimeInfoCollector` | 采集进程ID、运行时长、线程数 |

### 服务组件

| 组件 | 类名 | 功能 |
|------|------|------|
| 上报服务 | `InstanceReportService` | 定时采集并上报实例信息 |
| 配置类 | `AgentProperties` | 配置属性绑定 |
| 自动配置 | `AgentAutoConfiguration` | Spring Boot自动配置 |
| 应用主类 | `AgentApplication` | Agent应用入口 |

## 配置参数详解

### 基础配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `monihub.agent.instance-id` | String | - | **必填**，实例唯一标识 |
| `monihub.agent.server-url` | String | http://localhost:9080 | 服务端地址 |
| `monihub.agent.agent-type` | String | java | Agent类型 |
| `monihub.agent.agent-version` | String | 1.0.0 | Agent版本 |

### 上报配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `monihub.agent.report.enabled` | Boolean | true | 是否启用上报 |
| `monihub.agent.report.interval-seconds` | Long | 60 | 上报间隔（秒） |

### 任务配置（待实现）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `monihub.agent.task.enabled` | Boolean | true | 是否启用任务功能 |
| `monihub.agent.task.poll-interval-seconds` | Long | 30 | 任务拉取间隔 |
| `monihub.agent.task.long-poll-enabled` | Boolean | true | 是否启用长轮询 |
| `monihub.agent.task.long-poll-timeout-seconds` | Integer | 30 | 长轮询超时 |
| `monihub.agent.task.max-concurrent-tasks` | Integer | 5 | 最大并发任务数 |

## 日志配置

Agent使用SLF4J日志框架，建议日志级别：

- 生产环境：`INFO`
- 开发/调试：`DEBUG`

```yaml
logging:
  level:
    tech.aione.monihub.agent: DEBUG
```

## 故障排查

### 1. 上报失败

**现象**：日志显示 "Instance report failed"

**排查步骤**：
1. 检查 `instance-id` 是否正确
2. 检查服务端地址是否可访问：`curl http://server-url/health`
3. 查看服务端日志
4. 检查网络连接

### 2. 数据采集异常

**现象**：日志显示 "Failed to collect xxx info"

**排查步骤**：
1. 检查OSHI库版本兼容性
2. 检查操作系统权限
3. 查看详细错误堆栈

### 3. 无法获取公网IP

**现象**：public_ip 字段为空

**说明**：这是正常现象，可能原因：
- 实例无公网访问
- 公网IP服务不可达
- 已启用缓存（1小时）

## 性能考虑

1. **CPU采集延迟**：CPU使用率采集需要1秒采样时间
2. **公网IP缓存**：公网IP每小时最多查询一次，减少网络请求
3. **上报间隔**：默认60秒，可根据实际需求调整（建议不低于30秒）
4. **内存占用**：约50-100MB（包含OSHI库）

## 安全建议

1. **实例ID保密**：不要在公开代码中硬编码实例ID
2. **网络隔离**：建议Agent与服务端在同一内网
3. **最小权限**：Agent进程以受限用户运行
4. **日志脱敏**：生产环境避免记录敏感信息

## 版本历史

### v0.1.0 (2025-11-03)
- ✅ 实现数据采集模块
- ✅ 实现自动上报服务
- ✅ 实现Spring Boot自动配置
- ⏳ 任务拉取与执行（待完善）

## 后续计划

1. 实现任务拉取与执行引擎
2. 实现文件上传下载功能
3. 添加单元测试
4. 性能优化和资源占用降低
5. 支持更多操作系统和平台

## 许可证

待定

## 联系方式

- 项目主页：https://github.com/ai-one-tech/aione-monihub
- 问题反馈：https://github.com/ai-one-tech/aione-monihub/issues
