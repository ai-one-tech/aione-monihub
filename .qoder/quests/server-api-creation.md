# AiOne MoniHub 服务端 API 设计文档

## 1. 概述

AiOne MoniHub 是一个集成化监控和管理平台，旨在通过 PC 和移动设备的浏览器进行访问。系统的主要功能包括远程管理部署的应用、实现远程终端、远程文件管理和系统监控等。

本设计文档详细描述了服务端 API 的架构、接口设计、数据模型和安全机制，以支持系统的各项功能。

## 2. 技术架构

### 2.1 后端技术栈
- **语言**: Rust
- **Web 框架**: Actix Web
- **数据库**: DuckDB（未来可更换为 PostgreSQL 或 MySQL）
- **WebSocket**: 用于实时通信
- **认证**: JWT Token
- **序列化**: serde

### 2.2 API 架构设计
```
+-------------------+
|    Client/UI      |
+-------------------+
         |
         | HTTP/HTTPS + WebSocket
         v
+-------------------+
|   Actix Web API   |
+-------------------+
         |
         | Internal Calls
         v
+-------------------+
| Business Logic    |
+-------------------+
         |
         | Database Operations
         v
+-------------------+
|    Database       |
+-------------------+
```

## 3. API 端点设计

### 3.1 认证相关接口

#### 登录接口
- **URL**: `POST /api/auth/login`
- **描述**: 用户身份验证
- **请求参数**:
  ```json
  {
    "username": "string",
    "password": "string",
    }
  ```
- **响应**:
  ```json
  {
    "token": "string",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "roles": ["string"]
    },
    "timestamp": "datetime",
    "trace_id": "string"
  }
  ```

#### 忘记密码
- **URL**: `POST /api/auth/forgot-password`
- **描述**: 发送密码重置邮件
- **请求参数**:
  ```json
  {
    "email": "string"
  }
  ```

#### 重置密码
- **URL**: `POST /api/auth/reset-password`
- **描述**: 重置用户密码
- **请求参数**:
  ```json
  {
    "token": "string",
    "new_password": "string"
  }
  ```

### 3.2 项目管理接口

#### 获取项目列表
- **URL**: `GET /api/projects`
- **描述**: 获取项目列表，支持分页、搜索和过滤
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `search`: 搜索关键词
  - `status`: 项目状态过滤
- **响应**:
  ```json
  {
    "data": [
      {
        "id": "string",
        "name": "string",
        "code": "string",
        "status": "string",
        "description": "string",
        "created_at": "datetime",
        "updated_at": "datetime"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number"
    },
    "timestamp": "datetime",
    "trace_id": "string"
  }
  ```

#### 创建项目
- **URL**: `POST /api/projects`
- **描述**: 创建新项目
- **请求参数**:
  ```json
  {
    "name": "string",
    "code": "string",
    "status": "string",
    "description": "string"
  }
  ```

#### 获取项目详情
- **URL**: `GET /api/projects/{id}`
- **描述**: 获取项目详细信息

#### 更新项目
- **URL**: `PUT /api/projects/{id}`
- **描述**: 更新项目信息
- **请求参数**:
  ```json
  {
    "name": "string",
    "code": "string",
    "status": "string",
    "description": "string"
  }
  ```

#### 删除项目
- **URL**: `DELETE /api/projects/{id}`
- **描述**: 删除项目

### 3.3 应用管理接口

#### 获取应用列表
- **URL**: `GET /api/applications`
- **描述**: 获取应用列表，支持分页、搜索和过滤
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `search`: 搜索关键词
  - `project_id`: 项目ID过滤
  - `status`: 应用状态过滤

#### 创建应用
- **URL**: `POST /api/applications`
- **描述**: 创建新应用
- **请求参数**:
  ```json
  {
    "project_id": "string",
    "name": "string",
    "code": "string",
    "status": "string",
    "description": "string",
    "authorization": {
      "users": ["string"],
      "expiry_date": "datetime"
    }
  }
  ```

#### 获取应用详情
- **URL**: `GET /api/applications/{id}`
- **描述**: 获取应用详细信息

#### 更新应用
- **URL**: `PUT /api/applications/{id}`
- **描述**: 更新应用信息

#### 删除应用
- **URL**: `DELETE /api/applications/{id}`
- **描述**: 删除应用

### 3.4 部署管理接口

#### 获取部署列表
- **URL**: `GET /api/deployments`
- **描述**: 获取部署列表，支持分页、搜索和过滤
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `search`: 搜索关键词
  - `application_id`: 应用ID过滤
  - `status`: 部署状态过滤

#### 创建部署
- **URL**: `POST /api/deployments`
- **描述**: 创建新部署
- **请求参数**:
  ```json
  {
    "application_id": "string",
    "private_ip": "string",
    "public_ip": "string",
    "network_interface": "string",
    "hostname": "string",
    "environment_vars": {
      "key": "value"
    },
    "service_port": "number",
    "process_name": "string",
    "status": "string"
  }
  ```

#### 获取部署详情
- **URL**: `GET /api/deployments/{id}`
- **描述**: 获取部署详细信息

#### 更新部署
- **URL**: `PUT /api/deployments/{id}`
- **描述**: 更新部署信息

#### 删除部署
- **URL**: `DELETE /api/deployments/{id}`
- **描述**: 删除部署

#### 远程终端访问
- **URL**: `GET /api/deployments/{id}/terminal`
- **描述**: 建立远程终端连接 (WebSocket)

#### 文件管理
- **URL**: `GET /api/deployments/{id}/files`
- **描述**: 获取文件列表
- **URL**: `POST /api/deployments/{id}/files/upload`
- **描述**: 上传文件
- **URL**: `GET /api/deployments/{id}/files/{file_path}`
- **描述**: 下载文件
- **URL**: `DELETE /api/deployments/{id}/files/{file_path}`
- **描述**: 删除文件

#### 系统监控
- **URL**: `GET /api/deployments/{id}/monitoring`
- **描述**: 获取系统监控数据
- **响应**:
  ```json
  {
    "cpu_usage": "number",
    "memory_usage": "number",
    "disk_usage": "number",
    "network_traffic": {
      "in": "number",
      "out": "number"
    },
    "timestamp": "datetime"
  }
  ```

### 3.5 用户管理接口

#### 获取用户列表
- **URL**: `GET /api/users`
- **描述**: 获取用户列表，支持分页、搜索和过滤

#### 创建用户
- **URL**: `POST /api/users`
- **描述**: 创建新用户

#### 获取用户详情
- **URL**: `GET /api/users/{id}`
- **描述**: 获取用户详细信息

#### 更新用户
- **URL**: `PUT /api/users/{id}`
- **描述**: 更新用户信息

#### 删除用户
- **URL**: `DELETE /api/users/{id}`
- **描述**: 删除用户

#### 禁用用户
- **URL**: `POST /api/users/{id}/disable`
- **描述**: 禁用用户

#### 启用用户
- **URL**: `POST /api/users/{id}/enable`
- **描述**: 启用用户

### 3.6 角色管理接口

#### 获取角色列表
- **URL**: `GET /api/roles`
- **描述**: 获取角色列表

#### 创建角色
- **URL**: `POST /api/roles`
- **描述**: 创建新角色
- **请求参数**:
  ```json
  {
    "name": "string",
    "description": "string",
    "permissions": ["string"]
  }
  ```

#### 获取角色详情
- **URL**: `GET /api/roles/{id}`
- **描述**: 获取角色详细信息

#### 更新角色
- **URL**: `PUT /api/roles/{id}`
- **描述**: 更新角色信息

#### 删除角色
- **URL**: `DELETE /api/roles/{id}`
- **描述**: 删除角色

### 3.7 权限管理接口

#### 获取权限列表
- **URL**: `GET /api/permissions`
- **描述**: 获取权限列表

#### 批量分配权限
- **URL**: `POST /api/permissions/assign`
- **描述**: 批量分配权限给角色
- **请求参数**:
  ```json
  {
    "role_id": "string",
    "permissions": ["string"]
  }
  ```

#### 批量撤销权限
- **URL**: `POST /api/permissions/revoke`
- **描述**: 批量撤销角色的权限

### 3.8 日志管理接口

#### 获取日志列表
- **URL**: `GET /api/logs`
- **描述**: 获取日志列表，支持分页、搜索和过滤
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `type`: 日志类型 (login, operation)
  - `user_id`: 用户ID过滤
  - `start_date`: 开始日期
  - `end_date`: 结束日期

#### 导出日志
- **URL**: `GET /api/logs/export`
- **描述**: 导出日志数据

### 3.9 机器管理接口

#### 获取机器列表
- **URL**: `GET /api/machines`
- **描述**: 获取机器列表，支持分页、搜索和过滤

#### 创建机器
- **URL**: `POST /api/machines`
- **描述**: 创建新机器
- **请求参数**:
  ```json
  {
    "name": "string",
    "type": "string",
    "status": "string",
    "deployment_id": "string",
    "application_id": "string"
  }
  ```

#### 获取机器详情
- **URL**: `GET /api/machines/{id}`
- **描述**: 获取机器详细信息

#### 更新机器
- **URL**: `PUT /api/machines/{id}`
- **描述**: 更新机器信息

#### 删除机器
- **URL**: `DELETE /api/machines/{id}`
- **描述**: 删除机器

#### 获取机器监控数据
- **URL**: `GET /api/machines/{id}/monitoring-data`
- **描述**: 获取机器监控历史数据，用于统计分析
- **查询参数**:
  - `start_time`: 开始时间
  - `end_time`: 结束时间
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)

### 3.10 元数据配置接口

#### 获取配置列表
- **URL**: `GET /api/configs`
- **描述**: 获取配置列表，支持分页、搜索和过滤（默认每个code只返回最新版本）
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `search`: 搜索关键词
  - `type`: 配置类型过滤
  - `environment`: 环境类型过滤
  - `all_versions`: 是否返回所有版本 (默认: false)

#### 创建配置
- **URL**: `POST /api/configs`
- **描述**: 创建新配置（相同code和environment的新版本，版本号自动递增）
- **请求参数**:
  ```json
  {
    "code": "string",
    "environment": "string", // 环境类型
    "name": "string",
    "type": "string", // json, html, text
    "content": "string",
    "description": "string"
  }
  ```

#### 根据编码获取所有环境的配置
- **URL**: `GET /api/configs/code/{code}`
- **描述**: 根据配置编码获取所有环境下的最新配置版本

#### 根据编码和环境获取配置
- **URL**: `GET /api/configs/code/{code}/environment/{environment}`
- **描述**: 根据配置编码和环境获取配置详情（返回该环境下的最新版本）

#### 根据编码、环境和版本获取配置
- **URL**: `GET /api/configs/code/{code}/environment/{environment}/version/{version}`
- **描述**: 根据配置编码、环境和版本号获取特定版本的配置

#### 删除配置
- **URL**: `DELETE /api/configs/{id}`
- **描述**: 删除配置

## 4. 数据模型设计

### 4.1 用户模型 (User)
| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | String | 用户ID |
| username | String | 用户名 |
| email | String | 邮箱 |
| password_hash | String | 密码哈希 |
| status | String | 状态 (active, disabled) |
| created_by | String | 创建人 |
| updated_by | String | 修改人 |
| deleted_at | DateTime | 删除时间 (逻辑删除) |
| revision | Number | 乐观锁版本号 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

**注意**: 所有数据表均采用逻辑删除策略，通过 `deleted_at` 字段标记删除状态，不进行物理删除

### 4.2 项目模型 (Project)
| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | String | 项目ID |
| name | String | 项目名称 |
| code | String | 项目编码 |
| status | String | 项目状态 |
| description | String | 项目简介 |
| created_by | String | 创建人 |
| updated_by | String | 修改人 |
| deleted_at | DateTime | 删除时间 (逻辑删除) |
| revision | Number | 乐观锁版本号 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

**注意**: 所有数据表均采用逻辑删除策略，通过 `deleted_at` 字段标记删除状态，不进行物理删除

### 4.3 应用模型 (Application)
| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | String | 应用ID |
| project_id | String | 所属项目ID |
| name | String | 应用名称 |
| code | String | 应用编码 |
| status | String | 应用状态 |
| description | String | 应用介绍 |
| authorization | Object | 授权信息 |
| created_by | String | 创建人 |
| updated_by | String | 修改人 |
| deleted_at | DateTime | 删除时间 (逻辑删除) |
| revision | Number | 乐观锁版本号 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

**注意**: 所有数据表均采用逻辑删除策略，通过 `deleted_at` 字段标记删除状态，不进行物理删除

### 4.4 部署模型 (Deployment)
| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | String | 部署ID |
| application_id | String | 关联应用ID |
| private_ip | String | 内网IP |
| public_ip | String | 公网IP |
| network_interface | String | 网卡标识 |
| hostname | String | 主机名称 |
| environment_vars | Object | 环境变量 |
| service_port | Number | 服务端口 |
| process_name | String | 进程名称 |
| status | String | 部署状态 |
| created_by | String | 创建人 |
| updated_by | String | 修改人 |
| deleted_at | DateTime | 删除时间 (逻辑删除) |
| revision | Number | 乐观锁版本号 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

**注意**: 所有数据表均采用逻辑删除策略，通过 `deleted_at` 字段标记删除状态，不进行物理删除

### 4.5 角色模型 (Role)
| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | String | 角色ID |
| name | String | 角色名称 |
| description | String | 角色描述 |
| permissions | Array | 权限集合 |
| created_by | String | 创建人 |
| updated_by | String | 修改人 |
| deleted_at | DateTime | 删除时间 (逻辑删除) |
| revision | Number | 乐观锁版本号 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

**注意**: 所有数据表均采用逻辑删除策略，通过 `deleted_at` 字段标记删除状态，不进行物理删除

### 4.6 权限模型 (Permission)
| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | String | 权限ID |
| name | String | 权限名称 |
| description | String | 权限描述 |
| resource | String | 资源 |
| action | String | 操作 |
| created_by | String | 创建人 |
| updated_by | String | 修改人 |
| deleted_at | DateTime | 删除时间 (逻辑删除) |
| revision | Number | 乐观锁版本号 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

**注意**: 所有数据表均采用逻辑删除策略，通过 `deleted_at` 字段标记删除状态，不进行物理删除

### 4.7 日志模型 (Log)
| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | String | 日志ID |
| type | String | 日志类型 (login, operation) |
| user_id | String | 用户ID |
| action | String | 操作描述 |
| ip_address | String | IP地址 |
| user_agent | String | 用户代理 |
| created_by | String | 创建人 |
| updated_by | String | 修改人 |
| deleted_at | DateTime | 删除时间 (逻辑删除) |
| revision | Number | 乐观锁版本号 |
| timestamp | DateTime | 时间戳 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

**注意**: 所有数据表均采用逻辑删除策略，通过 `deleted_at` 字段标记删除状态，不进行物理删除

### 4.8 机器模型 (Machine)
| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | String | 机器ID |
| name | String | 机器名称 |
| type | String | 机器类型 |
| status | String | 机器状态 |
| deployment_id | String | 关联部署ID |
| application_id | String | 关联应用ID |
| created_by | String | 创建人 |
| updated_by | String | 修改人 |
| deleted_at | DateTime | 删除时间 (逻辑删除) |
| revision | Number | 乐观锁版本号 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

**注意**: 所有数据表均采用逻辑删除策略，通过 `deleted_at` 字段标记删除状态，不进行物理删除

### 4.9 机器监控数据模型 (MachineMonitoringData)
| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | String | 监控数据ID |
| machine_id | String | 机器ID |
| deployment_id | String | 部署ID |
| application_id | String | 应用ID |
| cpu_usage | Number | CPU使用率 (%) |
| memory_usage | Number | 内存使用率 (%) |
| disk_usage | Number | 磁盘使用率 (%) |
| network_traffic_in | Number | 网络流入流量 (bytes) |
| network_traffic_out | Number | 网络流出流量 (bytes) |
| timestamp | DateTime | 数据采集时间 |
| created_by | String | 创建人 |
| updated_by | String | 修改人 |
| deleted_at | DateTime | 删除时间 (逻辑删除) |
| revision | Number | 乐观锁版本号 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

**注意**: 所有数据表均采用逻辑删除策略，通过 `deleted_at` 字段标记删除状态，不进行物理删除

### 4.10 元数据配置模型 (MetadataConfig)
| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | String | 配置ID |
| code | String | 配置编码 (唯一标识) |
| version | Number | 配置版本号 (同一code的配置版本号递增) |
| environment | String | 环境类型 (dev, test, prod等) |
| name | String | 配置名称 |
| type | String | 配置类型 (json, html, text) |
| content | String | 配置内容 |
| description | String | 配置描述 |
| created_by | String | 创建人 |
| deleted_at | DateTime | 删除时间 (逻辑删除) |
| created_at | DateTime | 创建时间 |

**配置版本控制说明**:
- 配置通过 `code` 和 `environment` 字段联合标识，同一 `code` 在不同环境可以有不同配置
- 版本号 (`version`) 由系统自动分配，同一 `code` 和 `environment` 组合的配置版本号递增
- 不允许直接修改已有配置，只允许新增
- 读取配置时默认返回指定 `code` 和 `environment` 的最新版本（版本号最大的一条）

## 5. WebSocket 通信设计

### 5.1 连接建立
- **URL**: `ws://server/ws`
- **认证**: 通过 JWT Token 认证
- **协议**: WebSocket

### 5.2 消息格式
```json
{
  "type": "string", // 消息类型
  "payload": "object", // 消息内容
  "timestamp": "datetime", // 服务器时间戳
  "trace_id": "string" // 分布式跟踪ID
}
```

### 5.3 消息类型

#### 监控数据上报
- **Type**: `monitoring_data`
- **描述**: 客户端定时上报监控数据
- **Payload**:
  ```json
  {
    "machine_id": "string",
    "deployment_id": "string",
    "application_id": "string",
    "timezone": "string",
    "timestamp": "datetime",
    "cpu_usage": "number",
    "memory_usage": "number",
    "disk_usage": "number",
    "network_traffic": {
      "in": "number",
      "out": "number"
    }
  }
  ```

#### 命令下发
- **Type**: `command`
- **描述**: 服务端下发命令到客户端
- **Payload**:
  ```json
  {
    "command_id": "string",
    "command": "string",
    "parameters": "object",
    "timestamp": "datetime",
    "trace_id": "string"
  }
  ```

#### 命令执行结果
- **Type**: `command_result`
- **描述**: 客户端返回命令执行结果
- **Payload**:
  ```json
  {
    "command_id": "string",
    "result": "object",
    "status": "string" // success, failed
  }
  ```

## 6. 安全设计

### 6.1 认证机制
- 使用 JWT Token 进行用户身份认证
- Token 有效期可配置，默认为 7 天
- 支持刷新 Token

### 6.2 授权机制
- 基于角色的访问控制 (RBAC)
- 每个接口都有明确的权限要求
- 用户只能访问其角色允许的资源

### 6.3 数据安全
- 敏感数据加密存储 (如密码)
- HTTPS 传输加密
- 防止 SQL 注入和 XSS 攻击
- 所有数据表均采用逻辑删除策略，不进行物理删除

### 6.4 安全防护
- 限流控制，防止恶意请求
- 输入验证，防止非法数据
- 日志记录，便于安全审计

## 7. 错误处理

### 7.1 错误响应格式
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object"
  },
  "timestamp": "datetime",
  "trace_id": "string"
}
```

### 7.2 常见错误码
| 错误码 | 描述 |
|-------|------|
| AUTH_001 | 未授权访问 |
| AUTH_002 | 无效的认证令牌 |
| AUTH_003 | 认证令牌已过期 |
| VALID_001 | 请求参数验证失败 |
| RES_001 | 资源不存在 |
| RES_002 | 资源已存在 |
| SYS_001 | 系统内部错误 |

## 8. 性能考虑

### 8.1 数据库优化
- 合理设计索引，提高查询效率
- 分页查询，避免大量数据传输
- 数据缓存，减少数据库访问

### 8.2 API 优化
- 响应数据压缩
- 连接池管理
- 异步处理耗时操作

### 8.3 WebSocket 优化
- 心跳机制，保持连接活跃
- 消息批量发送，减少网络开销
- 连接复用，减少连接建立开销