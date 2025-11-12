# AiOne MoniHub 项目指南

## 项目概述

AiOne MoniHub 是一个实例信息上报与远程控制平台，支持多语言 Agent（Java、Golang、Rust、JavaScript、App等）向服务端上报运行状态，并支持服务端向 Agent 下发任务指令。该项目采用 Rust 后端 + React 前端的架构，使用 PostgreSQL 作为数据库。

### 核心功能

1. **实例信息上报**：Agent 定期向服务端上报系统信息、网络信息、硬件资源使用情况等
2. **远程任务控制**：服务端可向 Agent 下发多种类型的任务（Shell命令执行、文件操作等）
3. **任务管理**：支持任务创建、调度、执行记录追踪和状态管理
4. **历史数据存储**：完整保存所有上报数据和任务执行记录

## 项目架构

### 后端 (Rust)
- **框架**：Actix Web
- **ORM**：SeaORM
- **数据库**：PostgreSQL
- **认证**：JWT

### Agent (Java)
- **框架**：Spring Boot 2.3.x
- **HTTP客户端**：OkHttp 3.x
- **系统信息**：OSHI 6.x
- **JSON处理**：Jackson 2.x

### 前端 (React)
- **框架**：React 19 + TypeScript
- **构建工具**：Vite
- **UI库**：Shadcn UI + Tailwind CSS
- **路由**：TanStack Router
- **状态管理**：TanStack Query + Zustand

## 项目结构

```
aione-monihub/
├── apps/
│   ├── server/                          # Rust 后端服务
│   │   ├── migrations/                  # 数据库迁移文件
│   │   ├── src/
│   │   │   ├── entities/                # SeaORM 实体
│   │   │   ├── instance_reports/        # 实例上报模块
│   │   │   ├── instance_tasks/          # 任务管理模块
│   │   │   ├── instances/               # 实例管理
│   │   │   └── ...                      # 其他模块
│   ├── agent/
│   │   ├── java/                        # Java Agent
│   │   │   ├── src/main/java/
│   │   │   │   ├── collector/           # 信息收集器
│   │   │   │   ├── handler/             # 任务处理器
│   │   │   │   ├── model/               # 数据模型
│   │   │   │   ├── service/             # 服务层
│   │   │   │   └── config/              # 配置
│   │   └── js/                          # JavaScript Agent
│   └── frontend/                        # React 前端
│       ├── src/
│       │   ├── components/              # UI 组件
│       │   ├── features/                # 功能模块
│       │   ├── hooks/                   # 自定义 Hook
│       │   ├── lib/                     # 工具库
│       │   └── routes/                  # 路由定义
├── docs/                                # 文档
└── README.md
```

## 数据库设计

### 核心表结构

1. **instances 表**：存储实例基本信息及实时状态字段
   - agent_type: Agent类型（java, golang, rust, javascript, app）
   - cpu_usage_percent, memory_usage_percent, disk_usage_percent: 资源使用率
   - network_type: 上网方式（wired, wifi, mobile, vpn）

2. **instance_records 表**：存储每次Agent上报的完整历史数据
   - 包含系统信息、网络信息、硬件资源、运行状态等详细字段
   - 按时间索引，支持历史查询

3. **instance_tasks 表**：存储任务定义和目标实例列表
   - task_type: 任务类型（shell_exec, internal_cmd, file_upload等）
   - priority: 优先级（1-10）
   - timeout_seconds: 超时时长

4. **instance_task_records 表**：存储任务执行记录
   - status: 执行状态（pending, dispatched, running, success, failed, timeout, cancelled）
   - duration_ms: 执行耗时

## 核心功能实现

### 1. 实例信息上报机制

- **开放API**：`POST /api/open/instances/report`（无需认证）
- **上报内容**：系统信息、网络信息、硬件资源使用情况等
- **自动统计**：上报次数、首次/末次上报时间
- **历史查询**：`GET /api/instances/{instance_id}/reports`

### 2. 任务管理与执行

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

### 3. 长轮询机制

- **任务拉取**：`GET /api/open/instances/{instance_id}/tasks?wait=true&timeout=30`
  - 最长hold 30秒
  - 按优先级排序
  - 自动更新状态为dispatched

- **结果回传**：`POST /api/open/instances/tasks/result`
  - 验证记录和实例ID
  - 返回success确认

## 开发和构建指南

### 后端 (Rust)

```bash
# 数据库迁移
cd apps/server
psql -U your_user -d aione_monihub -f migrations/003_instance_report_and_control.sql

# 启动服务
cargo build
cargo run
```

### Java Agent

```bash
# 编译
cd apps/agent/java
mvn clean package

# 运行
java -jar target/aione-monihub-agent-java-1.0.0.jar
```

### 前端 (React)

```bash
# 安装依赖
cd apps/frontend
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 技术特性

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

## 安全措施

- 开放API仅限于Agent操作
- 实例ID验证防止越权访问
- 所有修改操作需要JWT认证
- 建议生产环境配置IP白名单
- 建议对敏感命令进行白名单过滤

## 下一步计划

### 优先级1（核心功能）
1. 完成 Java Agent 开发
2. 端到端测试（上报 → 任务下发 → 执行 → 回传）
3. 完成前端任务管理界面

### 优先级2（增强功能）
4. 实现文件上传下载功能
5. 添加任务编排功能（任务依赖关系）
6. 添加告警功能（基于上报数据）

### 优先级3（质量保障）
7. 完善单元测试和集成测试
8. 性能测试和优化
9. 完善文档和部署指南