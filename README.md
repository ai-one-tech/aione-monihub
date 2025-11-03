# AiOne MoniHub - 实例信息上报与远程控制功能

## 项目概述

本项目为 AiOne MoniHub 监控平台添加了实例信息上报和远程控制功能，支持多语言 Agent（Java、Golang、Rust、JavaScript、App等）向服务端上报运行状态，并支持服务端向 Agent 下发任务指令。

## 已完成功能

### ✅ 后端核心功能（100%完成）

#### 1. 数据库架构
- **instance_records 表**：存储每次Agent上报的完整历史数据
- **instance_tasks 表**：存储任务定义和目标实例列表
- **instance_task_records 表**：存储任务执行记录
- **instances 表扩展**：新增实时状态字段（CPU、内存、磁盘使用率等）

#### 2. 实例信息上报
- **开放HTTP API**：POST /api/open/instances/report（无需认证）
- **支持数据**：
  - 系统信息（OS类型、版本、主机名）
  - 网络信息（内网IP、公网IP、MAC地址、上网方式）
  - 硬件资源（CPU、内存、磁盘使用率）
  - 运行状态（进程ID、运行时长、线程数）
  - 自定义指标（JSON格式）
- **自动统计**：上报次数、首次/末次上报时间
- **历史查询**：GET /api/instances/{instance_id}/reports

#### 3. 任务管理
- **7种任务类型**：
  - shell_exec：Shell命令执行
  - internal_cmd：内部命令
  - file_upload：文件上传
  - file_download：文件下载
  - file_browse：文件浏览
  - file_view：文件查看
  - file_delete：文件删除
- **完整的CRUD接口**：创建、查询、删除、取消任务
- **执行记录追踪**：状态流转、结果查看、失败重试

#### 4. 任务下发与回传
- **长轮询机制**：GET /api/open/instances/{instance_id}/tasks?wait=true&timeout=30
  - 最长hold 30秒
  - 按优先级排序
  - 自动更新状态为dispatched
- **结果回传**：POST /api/open/instances/tasks/result
  - 验证记录和实例ID
  - 返回success确认（Agent据此删除本地缓存）

### 🔄 进行中功能

#### 5. Java Agent开发（已搭建框架）
- ✅ Maven项目结构（JDK 1.8兼容）
- ✅ 依赖配置（OkHttp、OSHI、Jackson、Spring Boot）
- ⏳ 数据采集模块
- ⏳ 上报调度器
- ⏳ 任务拉取模块
- ⏳ 任务执行引擎
- ⏳ 结果回传机制
- ⏳ Spring Boot自动配置

### 📋 待实现功能

#### 6. 前端任务管理界面
- 任务列表页面
- 任务创建表单
- 任务详情和执行记录页面
- 实时状态刷新

#### 7. 文件上传下载
- 服务端文件上传接口
- 服务端文件下载接口
- Agent端文件处理器

#### 8. 测试和文档
- 后端单元测试和集成测试
- Java Agent测试用例
- API文档和使用说明

## 项目结构

```
aione-monihub/
├── apps/
│   ├── server/                          # Rust 后端服务
│   │   ├── migrations/
│   │   │   └── 003_instance_report_and_control.sql  # 新增迁移文件
│   │   └── src/
│   │       ├── entities/                # SeaORM 实体
│   │       │   ├── instance_records.rs  # 上报记录实体
│   │       │   ├── instance_tasks.rs    # 任务实体
│   │       │   └── instance_task_records.rs  # 任务执行记录实体
│   │       ├── instance_reports/        # 实例上报模块
│   │       │   ├── models.rs
│   │       │   ├── handlers.rs
│   │       │   ├── routes.rs
│   │       │   └── mod.rs
│   │       ├── instance_tasks/          # 任务管理模块
│   │       │   ├── models.rs
│   │       │   ├── handlers.rs
│   │       │   ├── routes.rs
│   │       │   └── mod.rs
│   │       └── auth/
│   │           └── middleware.rs        # 更新：添加 /api/open 到公开路径
│   ├── agent/
│   │   └── java/                        # Java Agent
│   │       ├── pom.xml                  # Maven 配置（已更新）
│   │       └── src/                     # 待实现
│   └── frontend/                        # React 前端（待扩展）
├── IMPLEMENTATION_SUMMARY.md            # 实施总结文档
└── README.md                            # 本文件
```

## API 接口文档

### 开放接口（无需认证）

#### 1. 实例信息上报
```http
POST /api/open/instances/report
Content-Type: application/json

{
  "instance_id": "string",
  "agent_type": "java|golang|rust|javascript|app",
  "agent_version": "string",
  "system_info": {
    "os_type": "string",
    "os_version": "string",
    "hostname": "string"
  },
  "network_info": {
    "ip_address": "string",
    "public_ip": "string",
    "mac_address": "string",
    "network_type": "wired|wifi|mobile|vpn"
  },
  "hardware_info": {
    "cpu_model": "string",
    "cpu_cores": 0,
    "cpu_usage_percent": 0.0,
    "memory_total_mb": 0,
    "memory_used_mb": 0,
    "memory_usage_percent": 0.0,
    "disk_total_gb": 0,
    "disk_used_gb": 0,
    "disk_usage_percent": 0.0
  },
  "runtime_info": {
    "process_id": 0,
    "process_uptime_seconds": 0,
    "thread_count": 0
  },
  "custom_metrics": {},
  "report_timestamp": "2025-11-03T10:00:00Z"
}
```

**响应**：
```json
{
  "status": "success",
  "message": "Instance report received successfully",
  "record_id": "string",
  "timestamp": 1234567890
}
```

#### 2. 拉取待执行任务（支持长轮询）
```http
GET /api/open/instances/{instance_id}/tasks?wait=true&timeout=30
```

**响应**：
```json
{
  "tasks": [
    {
      "task_id": "string",
      "record_id": "string",
      "task_type": "shell_exec|internal_cmd|file_upload|...",
      "task_content": {},
      "timeout_seconds": 300,
      "priority": 5
    }
  ],
  "timestamp": 1234567890
}
```

#### 3. 回传任务执行结果
```http
POST /api/open/instances/tasks/result
Content-Type: application/json

{
  "record_id": "string",
  "instance_id": "string",
  "status": "success|failed|timeout",
  "result_code": 0,
  "result_message": "string",
  "result_data": {},
  "error_message": "string",
  "start_time": "2025-11-03T10:05:00Z",
  "end_time": "2025-11-03T10:05:02Z",
  "duration_ms": 2000
}
```

**响应**：
```json
{
  "status": "success",
  "message": "Task result received successfully",
  "timestamp": 1234567890
}
```

### 认证接口（需要 JWT Token）

#### 4. 查询实例上报历史
```http
GET /api/instances/{instance_id}/reports?start_time=&end_time=&page=1&limit=20
Authorization: Bearer {token}
```

#### 5. 创建任务
```http
POST /api/instances/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "task_name": "string",
  "task_type": "shell_exec",
  "target_instances": ["instance_id_1", "instance_id_2"],
  "task_content": {
    "command": "ls -la /home",
    "working_dir": "/home"
  },
  "priority": 5,
  "timeout_seconds": 300,
  "retry_count": 0
}
```

#### 6. 获取任务列表
```http
GET /api/instances/tasks?page=1&limit=20&task_type=&start_time=&end_time=
Authorization: Bearer {token}
```

#### 7. 获取任务详情
```http
GET /api/instances/tasks/{task_id}
Authorization: Bearer {token}
```

#### 8. 删除任务（软删除）
```http
DELETE /api/instances/tasks/{task_id}
Authorization: Bearer {token}
```

#### 9. 取消任务
```http
POST /api/instances/tasks/{task_id}/cancel
Authorization: Bearer {token}
```

#### 10. 获取任务执行记录
```http
GET /api/instances/tasks/{task_id}/records?page=1&limit=20&status=
Authorization: Bearer {token}
```

#### 11. 重试失败任务
```http
POST /api/instances/task-records/{record_id}/retry
Authorization: Bearer {token}
```

## 快速开始

### 1. 数据库迁移

```bash
cd apps/server
psql -U your_user -d aione_monihub -f migrations/003_instance_report_and_control.sql
```

### 2. 启动服务端

```bash
cd apps/server
cargo build
cargo run
```

服务将在 `http://localhost:9080` 启动。

### 3. 测试实例上报

```bash
curl -X POST http://localhost:9080/api/open/instances/report \
  -H "Content-Type: application/json" \
  -d @test_data/report_example.json
```

### 4. 测试任务创建（需要JWT Token）

```bash
export TOKEN="your_jwt_token"
curl -X POST http://localhost:9080/api/instances/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @test_data/task_example.json
```

## 技术栈

### 后端
- **语言**：Rust
- **框架**：Actix Web
- **ORM**：SeaORM
- **数据库**：PostgreSQL
- **认证**：JWT

### Agent（Java）
- **语言**：Java 8+
- **框架**：Spring Boot 2.3.x
- **HTTP客户端**：OkHttp 3.x
- **系统信息**：OSHI 6.x
- **JSON处理**：Jackson 2.x

### 前端（待开发）
- **框架**：React + TypeScript
- **构建工具**：Vite
- **UI库**：Shadcn UI + Tailwind CSS

## 核心特性

### 1. 长轮询机制
- Agent 定期轮询（30-60秒）获取待执行任务
- 支持长轮询（最长hold 30秒），提升实时性
- 无需维持WebSocket长连接，降低实现复杂度

### 2. 状态机设计
- 任务状态：pending → dispatched → running → success/failed/timeout
- 清晰的状态流转，易于追踪和调试

### 3. 历史记录保留
- 所有上报数据完整保存到 instance_records 表
- 支持时间范围查询和分页
- 便于趋势分析和故障排查

### 4. 优先级调度
- 任务优先级（1-10，10最高）
- 高优先级任务优先下发

### 5. 容错设计
- 支持任务重试
- 超时控制
- Agent 本地缓存（防止结果丢失）
- 重试机制（3次，5s/10s/30s间隔）

## 性能考虑

- ✅ 所有必要的数据库索引已添加
- ✅ 长轮询避免频繁轮询带来的负载
- ✅ 分页查询防止大数据集查询
- ⚠️ 建议配置数据归档策略（保留3个月）

## 安全措施

- ✅ 开放API仅限于Agent操作
- ✅ 实例ID验证防止越权访问
- ✅ 所有修改操作需要JWT认证
- ⚠️ 建议生产环境配置IP白名单
- ⚠️ 建议对敏感命令进行白名单过滤

## 下一步计划

### 优先级1（核心功能）
1. ✅ 完成 Java Agent 开发
2. ✅ 端到端测试（上报 → 任务下发 → 执行 → 回传）
3. ⏳ 完成前端任务管理界面

### 优先级2（增强功能）
4. ⏳ 实现文件上传下载功能
5. ⏳ 添加任务编排功能（任务依赖关系）
6. ⏳ 添加告警功能（基于上报数据）

### 优先级3（质量保障）
7. ⏳ 完善单元测试和集成测试
8. ⏳ 性能测试和优化
9. ⏳ 完善文档和部署指南

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

待定

## 联系方式

- 项目主页：https://github.com/ai-one-tech/aione-monihub
- 问题反馈：https://github.com/ai-one-tech/aione-monihub/issues

---

**更新时间**：2025-11-03  
**版本**：v0.1.0  
**状态**：开发中（后端核心功能已完成）
