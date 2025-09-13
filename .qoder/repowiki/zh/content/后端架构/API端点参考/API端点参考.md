# API端点参考

<cite>
**本文档中引用的文件**  
- [projects/routes.rs](file://apps/server/src/projects/routes.rs)
- [projects/handlers.rs](file://apps/server/src/projects/handlers.rs)
- [projects/models.rs](file://apps/server/src/projects/models.rs)
- [applications/routes.rs](file://apps/server/src/applications/routes.rs)
- [applications/handlers.rs](file://apps/server/src/applications/handlers.rs)
- [applications/models.rs](file://apps/server/src/applications/models.rs)
- [configs/routes.rs](file://apps/server/src/configs/routes.rs)
- [configs/handlers.rs](file://apps/server/src/configs/handlers.rs)
- [configs/models.rs](file://apps/server/src/configs/models.rs)
- [deployments/routes.rs](file://apps/server/src/deployments/routes.rs)
- [deployments/handlers.rs](file://apps/server/src/deployments/handlers.rs)
- [deployments/models.rs](file://apps/server/src/deployments/models.rs)
- [machines/routes.rs](file://apps/server/src/machines/routes.rs)
- [machines/handlers.rs](file://apps/server/src/machines/handlers.rs)
- [machines/models.rs](file://apps/server/src/machines/models.rs)
- [users/routes.rs](file://apps/server/src/users/routes.rs)
- [users/handlers.rs](file://apps/server/src/users/handlers.rs)
- [users/models.rs](file://apps/server/src/users/models.rs)
- [roles/routes.rs](file://apps/server/src/roles/routes.rs)
- [roles/handlers.rs](file://apps/server/src/roles/handlers.rs)
- [roles/models.rs](file://apps/server/src/roles/models.rs)
- [permissions/routes.rs](file://apps/server/src/permissions/routes.rs)
- [permissions/handlers.rs](file://apps/server/src/permissions/handlers.rs)
- [permissions/models.rs](file://apps/server/src/permissions/models.rs)
- [auth/routes.rs](file://apps/server/src/auth/routes.rs)
- [auth/handlers.rs](file://apps/server/src/auth/handlers.rs)
- [auth/models.rs](file://apps/server/src/auth/models.rs)
- [health/routes.rs](file://apps/server/src/health/routes.rs)
- [health/handlers.rs](file://apps/server/src/health/handlers.rs)
- [logs/routes.rs](file://apps/server/src/logs/routes.rs)
- [logs/handlers.rs](file://apps/server/src/logs/handlers.rs)
- [logs/models.rs](file://apps/server/src/logs/models.rs)
</cite>

## 目录
1. [简介](#简介)
2. [路由注册与路径前缀](#路由注册与路径前缀)
3. [通用规范](#通用规范)
4. [项目模块](#项目模块)
5. [应用模块](#应用模块)
6. [配置模块](#配置模块)
7. [部署模块](#部署模块)
8. [机器模块](#机器模块)
9. [用户模块](#用户模块)
10. [角色模块](#角色模块)
11. [权限模块](#权限模块)
12. [认证模块](#认证模块)
13. [日志模块](#日志模块)
14. [健康检查](#健康检查)

## 简介
本文档详细描述了 aione-monihub 后端服务的所有 RESTful API 端点。文档覆盖了项目、应用、配置、部署、机器、用户、角色、权限、认证、日志和健康检查等核心业务模块。所有端点均通过 Utoipa 注解生成，确保与 Swagger UI 保持一致。每个端点都提供了 HTTP 方法、URL 路径、请求头、请求体、响应状态码和响应体的完整说明。

## 路由注册与路径前缀
所有 API 路由均在各自的 `mod.rs` 文件中通过模块聚合，并在 `main.rs` 中统一注册。路由路径以 `/api` 为前缀，部分模块（如日志）使用 `/api/v1` 版本化前缀。

**Section sources**
- [projects/routes.rs](file://apps/server/src/projects/routes.rs#L0-L10)
- [applications/routes.rs](file://apps/server/src/applications/routes.rs#L0-L10)
- [configs/routes.rs](file://apps/server/src/configs/routes.rs#L0-L11)
- [deployments/routes.rs](file://apps/server/src/deployments/routes.rs#L0-L16)
- [machines/routes.rs](file://apps/server/src/machines/routes.rs#L0-L11)
- [users/routes.rs](file://apps/server/src/users/routes.rs#L0-L10)
- [roles/routes.rs](file://apps/server/src/roles/routes.rs#L0-L10)
- [permissions/routes.rs](file://apps/server/src/permissions/routes.rs#L0-L10)
- [auth/routes.rs](file://apps/server/src/auth/routes.rs#L0-L10)
- [health/routes.rs](file://apps/server/src/health/routes.rs#L0-L5)
- [logs/routes.rs](file://apps/server/src/logs/routes.rs#L0-L7)

## 通用规范
本节描述所有 API 端点共有的规范。

### 认证
所有受保护的端点都需要在 `Authorization` 请求头中提供 Bearer Token。
```
Authorization: Bearer <your-jwt-token>
```

### 分页
大多数 `GET` 列表端点支持分页查询参数。
- `page` (可选): 当前页码，默认为 1
- `limit` (可选): 每页条目数，默认为 10

响应体中的 `pagination` 字段包含分页信息：
- `page`: 当前页码
- `limit`: 每页条目数
- `total`: 总条目数

### 过滤与排序
列表端点通常支持以下通用查询参数：
- `search`: 按名称或代码进行模糊搜索
- `status`: 按状态过滤（如 "active", "inactive"）
- `start_time` / `end_time`: 按时间范围过滤

### 响应结构
成功的响应通常遵循以下结构：
```json
{
  "data": {}, // 单个资源或资源数组
  "pagination": {}, // 分页信息（仅列表响应）
  "timestamp": 1234567890,
  "trace_id": "uuid-string"
}
```

**Section sources**
- [projects/models.rs](file://apps/server/src/projects/models.rs#L47-L68)
- [applications/models.rs](file://apps/server/src/applications/models.rs#L47-L68)
- [configs/models.rs](file://apps/server/src/configs/models.rs#L47-L80)
- [deployments/models.rs](file://apps/server/src/deployments/models.rs#L47-L68)
- [machines/models.rs](file://apps/server/src/machines/models.rs#L46-L90)
- [users/models.rs](file://apps/server/src/users/models.rs#L47-L68)

## 项目模块
管理项目资源的 API。

### 获取项目列表
- **HTTP 方法**: `GET`
- **路径**: `/api/projects`
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**:
  - `page` (可选): 页码
  - `limit` (可选): 每页数量
  - `search` (可选): 搜索关键字
  - `status` (可选): 状态过滤
- **成功响应 (200)**:
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "code": "string",
      "status": "string",
      "description": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  },
  "timestamp": 1234567890,
  "trace_id": "string"
}
```
- **其他状态码**: 400 (Bad Request), 500 (Internal Server Error)

### 创建项目
- **HTTP 方法**: `POST`
- **路径**: `/api/projects`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
```json
{
  "name": "string",
  "code": "string",
  "status": "string",
  "description": "string"
}
```
- **成功响应 (200)**: 返回 `ProjectResponse` 结构

### 获取单个项目
- **HTTP 方法**: `GET`
- **路径**: `/api/projects/{project_id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `project_id` (项目ID)
- **成功响应 (200)**: 返回 `ProjectResponse` 结构
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 更新项目
- **HTTP 方法**: `PUT`
- **路径**: `/api/projects/{project_id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `project_id` (项目ID)
- **请求体**: `ProjectCreateRequest` 结构
- **成功响应 (200)**: 返回 `ProjectResponse` 结构
- **其他状态码**: 404 (Not Found), 400 (Bad Request), 500 (Internal Server Error)

### 删除项目
- **HTTP 方法**: `DELETE`
- **路径**: `/api/projects/{project_id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `project_id` (项目ID)
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

**Section sources**
- [projects/routes.rs](file://apps/server/src/projects/routes.rs#L0-L10)
- [projects/handlers.rs](file://apps/server/src/projects/handlers.rs#L0-L173)
- [projects/models.rs](file://apps/server/src/projects/models.rs#L0-L68)

## 应用模块
管理应用资源的 API。

### 获取应用列表
- **HTTP 方法**: `GET`
- **路径**: `/api/applications`
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**: 与项目模块相同
- **成功响应 (200)**: 返回 `ApplicationListResponse` 结构

### 创建应用
- **HTTP 方法**: `POST`
- **路径**: `/api/applications`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: `ApplicationCreateRequest` 结构
- **成功响应 (200)**: 返回 `ApplicationResponse` 结构

### 获取单个应用
- **HTTP 方法**: `GET`
- **路径**: `/api/applications/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (应用ID)
- **成功响应 (200)**: 返回 `ApplicationResponse` 结构
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 更新应用
- **HTTP 方法**: `PUT`
- **路径**: `/api/applications/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (应用ID)
- **请求体**: `ApplicationCreateRequest` 结构
- **成功响应 (200)**: 返回 `ApplicationResponse` 结构
- **其他状态码**: 404 (Not Found), 400 (Bad Request), 500 (Internal Server Error)

### 删除应用
- **HTTP 方法**: `DELETE`
- **路径**: `/api/applications/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (应用ID)
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

**Section sources**
- [applications/routes.rs](file://apps/server/src/applications/routes.rs#L0-L10)
- [applications/handlers.rs](file://apps/server/src/applications/handlers.rs#L0-L190)
- [applications/models.rs](file://apps/server/src/applications/models.rs#L0-L68)

## 配置模块
管理配置资源的 API。

### 获取配置列表
- **HTTP 方法**: `GET`
- **路径**: `/api/configs`
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**:
  - `type_`: 配置类型过滤
  - `environment`: 环境过滤
  - `all_versions`: 是否返回所有版本
- **成功响应 (200)**: 返回 `ConfigListResponse` 结构

### 创建配置
- **HTTP 方法**: `POST`
- **路径**: `/api/configs`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: `ConfigCreateRequest` 结构
- **成功响应 (200)**: 返回 `ConfigResponse` 结构

### 按代码获取配置
- **HTTP 方法**: `GET`
- **路径**: `/api/configs/code/{code}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `code` (配置代码)
- **成功响应 (200)**: 返回 `ConfigListResponse` 结构
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 按代码和环境获取配置
- **HTTP 方法**: `GET`
- **路径**: `/api/configs/code/{code}/environment/{environment}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `code` (配置代码), `environment` (环境)
- **成功响应 (200)**: 返回 `ConfigResponse` 结构
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 按代码、环境和版本获取配置
- **HTTP 方法**: `GET`
- **路径**: `/api/configs/code/{code}/environment/{environment}/version/{version}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `code`, `environment`, `version`
- **成功响应 (200)**: 返回 `ConfigResponse` 结构
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 删除配置
- **HTTP 方法**: `DELETE`
- **路径**: `/api/configs/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (配置ID)
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

**Section sources**
- [configs/routes.rs](file://apps/server/src/configs/routes.rs#L0-L11)
- [configs/handlers.rs](file://apps/server/src/configs/handlers.rs#L0-L231)
- [configs/models.rs](file://apps/server/src/configs/models.rs#L0-L80)

## 部署模块
管理部署资源的 API。

### 获取部署列表
- **HTTP 方法**: `GET`
- **路径**: `/api/deployments`
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**: 与项目模块相同
- **成功响应 (200)**: 返回 `DeploymentListResponse` 结构

### 创建部署
- **HTTP 方法**: `POST`
- **路径**: `/api/deployments`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: `DeploymentCreateRequest` 结构
- **成功响应 (200)**: 返回 `DeploymentResponse` 结构

### 获取单个部署
- **HTTP 方法**: `GET`
- **路径**: `/api/deployments/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (部署ID)
- **成功响应 (200)**: 返回 `DeploymentResponse` 结构
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 更新部署
- **HTTP 方法**: `PUT`
- **路径**: `/api/deployments/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (部署ID)
- **请求体**: `DeploymentCreateRequest` 结构
- **成功响应 (200)**: 返回 `DeploymentResponse` 结构
- **其他状态码**: 404 (Not Found), 400 (Bad Request), 500 (Internal Server Error)

### 删除部署
- **HTTP 方法**: `DELETE`
- **路径**: `/api/deployments/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (部署ID)
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 获取部署监控数据
- **HTTP 方法**: `GET`
- **路径**: `/api/deployments/{id}/monitoring`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (部署ID)
- **成功响应 (200)**:
```json
{
  "cpu_usage": 45.5,
  "memory_usage": 60.2,
  "disk_usage": 75.8,
  "network_traffic": {
    "incoming": 1024.5,
    "outgoing": 512.3
  },
  "timestamp": "2023-01-01T00:00:00Z"
}
```

### 文件管理
- **列出文件**: `GET /api/deployments/{id}/files`
- **上传文件**: `POST /api/deployments/{id}/files/upload`
- **下载文件**: `GET /api/deployments/{id}/files/{file_path:.*}`
- **删除文件**: `DELETE /api/deployments/{id}/files/{file_path:.*}`

**Section sources**
- [deployments/routes.rs](file://apps/server/src/deployments/routes.rs#L0-L16)
- [deployments/handlers.rs](file://apps/server/src/deployments/handlers.rs#L0-L219)
- [deployments/models.rs](file://apps/server/src/deployments/models.rs#L0-L46)

## 机器模块
管理机器资源的 API。

### 获取机器列表
- **HTTP 方法**: `GET`
- **路径**: `/api/machines`
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**: 与项目模块相同，额外支持 `deployment_id` 和 `application_id`
- **成功响应 (200)**: 返回 `MachineListResponse` 结构

### 创建机器
- **HTTP 方法**: `POST`
- **路径**: `/api/machines`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: `MachineCreateRequest` 结构
- **成功响应 (200)**: 返回 `MachineResponse` 结构

### 获取单个机器
- **HTTP 方法**: `GET`
- **路径**: `/api/machines/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (机器ID)
- **成功响应 (200)**: 返回 `MachineResponse` 结构
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 更新机器
- **HTTP 方法**: `PUT`
- **路径**: `/api/machines/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (机器ID)
- **请求体**: `MachineCreateRequest` 结构
- **成功响应 (200)**: 返回 `MachineResponse` 结构
- **其他状态码**: 404 (Not Found), 400 (Bad Request), 500 (Internal Server Error)

### 删除机器
- **HTTP 方法**: `DELETE`
- **路径**: `/api/machines/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (机器ID)
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 获取机器监控数据
- **HTTP 方法**: `GET`
- **路径**: `/api/machines/{id}/monitoring-data`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (机器ID)
- **成功响应 (200)**: 返回 `MachineMonitoringDataResponse` 结构

**Section sources**
- [machines/routes.rs](file://apps/server/src/machines/routes.rs#L0-L11)
- [machines/handlers.rs](file://apps/server/src/machines/handlers.rs#L0-L131)
- [machines/models.rs](file://apps/server/src/machines/models.rs#L0-L90)

## 用户模块
管理用户资源的 API。

### 获取用户列表
- **HTTP 方法**: `GET`
- **路径**: `/api/users`
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**: 与项目模块相同
- **成功响应 (200)**: 返回 `UserListResponse` 结构

### 创建用户
- **HTTP 方法**: `POST`
- **路径**: `/api/users`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: `UserCreateRequest` 结构
- **成功响应 (200)**: 返回 `UserResponse` 结构

### 获取单个用户
- **HTTP 方法**: `GET`
- **路径**: `/api/users/{user_id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `user_id` (用户ID)
- **成功响应 (200)**: 返回 `UserResponse` 结构
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 更新用户
- **HTTP 方法**: `PUT`
- **路径**: `/api/users/{user_id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `user_id` (用户ID)
- **请求体**: `UserUpdateRequest` 结构
- **成功响应 (200)**: 返回 `UserResponse` 结构
- **其他状态码**: 404 (Not Found), 400 (Bad Request), 500 (Internal Server Error)

### 删除用户
- **HTTP 方法**: `DELETE`
- **路径**: `/api/users/{user_id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `user_id` (用户ID)
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 禁用用户
- **HTTP 方法**: `POST`
- **路径**: `/api/users/{user_id}/disable`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `user_id` (用户ID)
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 启用用户
- **HTTP 方法**: `POST`
- **路径**: `/api/users/{user_id}/enable`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `user_id` (用户ID)
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

**Section sources**
- [users/routes.rs](file://apps/server/src/users/routes.rs#L0-L10)
- [users/handlers.rs](file://apps/server/src/users/handlers.rs#L0-L202)
- [users/models.rs](file://apps/server/src/users/models.rs#L0-L66)

## 角色模块
管理角色资源的 API。

### 获取角色列表
- **HTTP 方法**: `GET`
- **路径**: `/api/roles`
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**: `page`, `limit`, `search`
- **成功响应 (200)**: 返回 `RoleListResponse` 结构

### 创建角色
- **HTTP 方法**: `POST`
- **路径**: `/api/roles`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: `RoleCreateRequest` 结构
- **成功响应 (200)**: 返回 `RoleResponse` 结构

### 获取单个角色
- **HTTP 方法**: `GET`
- **路径**: `/api/roles/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (角色ID)
- **成功响应 (200)**: 返回 `RoleResponse` 结构
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 更新角色
- **HTTP 方法**: `PUT`
- **路径**: `/api/roles/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (角色ID)
- **请求体**: `RoleUpdateRequest` 结构
- **成功响应 (200)**: 返回 `RoleResponse` 结构
- **其他状态码**: 404 (Not Found), 400 (Bad Request), 500 (Internal Server Error)

### 删除角色
- **HTTP 方法**: `DELETE`
- **路径**: `/api/roles/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (角色ID)
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

**Section sources**
- [roles/routes.rs](file://apps/server/src/roles/routes.rs#L0-L10)
- [roles/handlers.rs](file://apps/server/src/roles/handlers.rs#L0-L173)
- [roles/models.rs](file://apps/server/src/roles/models.rs#L0-L68)

## 权限模块
管理权限资源的 API。

### 获取权限列表
- **HTTP 方法**: `GET`
- **路径**: `/api/permissions`
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**: `page`, `limit`, `search`
- **成功响应 (200)**: 返回 `PermissionListResponse` 结构

### 创建权限
- **HTTP 方法**: `POST`
- **路径**: `/api/permissions`
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: `PermissionCreateRequest` 结构
- **成功响应 (200)**: 返回 `PermissionResponse` 结构

### 获取单个权限
- **HTTP 方法**: `GET`
- **路径**: `/api/permissions/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (权限ID)
- **成功响应 (200)**: 返回 `PermissionResponse` 结构
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

### 更新权限
- **HTTP 方法**: `PUT`
- **路径**: `/api/permissions/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (权限ID)
- **请求体**: `PermissionUpdateRequest` 结构
- **成功响应 (200)**: 返回 `PermissionResponse` 结构
- **其他状态码**: 404 (Not Found), 400 (Bad Request), 500 (Internal Server Error)

### 删除权限
- **HTTP 方法**: `DELETE`
- **路径**: `/api/permissions/{id}`
- **请求头**: `Authorization: Bearer <token>`
- **路径参数**: `id` (权限ID)
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 404 (Not Found), 500 (Internal Server Error)

**Section sources**
- [permissions/routes.rs](file://apps/server/src/permissions/routes.rs#L0-L10)
- [permissions/handlers.rs](file://apps/server/src/permissions/handlers.rs#L0-L173)
- [permissions/models.rs](file://apps/server/src/permissions/models.rs#L0-L68)

## 认证模块
处理用户认证的 API。

### 用户登录
- **HTTP 方法**: `POST`
- **路径**: `/api/auth/login`
- **请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```
- **成功响应 (200)**:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "roles": ["string"]
  },
  "timestamp": 1234567890,
  "trace_id": "string"
}
```
- **其他状态码**: 401 (Unauthorized), 500 (Internal Server Error)

### 忘记密码
- **HTTP 方法**: `POST`
- **路径**: `/api/auth/forgot-password`
- **请求体**:
```json
{
  "email": "string"
}
```
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 400 (Bad Request), 500 (Internal Server Error)

### 重置密码
- **HTTP 方法**: `POST`
- **路径**: `/api/auth/reset-password`
- **请求体**:
```json
{
  "token": "string",
  "new_password": "string"
}
```
- **成功响应 (200)**: 返回成功消息
- **其他状态码**: 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)

**Section sources**
- [auth/routes.rs](file://apps/server/src/auth/routes.rs#L0-L10)
- [auth/handlers.rs](file://apps/server/src/auth/handlers.rs#L0-L173)
- [auth/models.rs](file://apps/server/src/auth/models.rs#L0-L46)

## 日志模块
管理日志资源的 API。

### 获取日志列表
- **HTTP 方法**: `GET`
- **路径**: `/api/v1/logs`
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**:
  - `type_`: 日志类型
  - `user_id`: 用户ID
  - `start_date`: 开始日期
  - `end_date`: 结束日期
- **成功响应 (200)**: 返回 `LogListResponse` 结构

### 导出日志
- **HTTP 方法**: `GET`
- **路径**: `/api/v1/logs/export`
- **请求头**: `Authorization: Bearer <token>`
- **成功响应 (200)**: 返回导出成功消息

**Section sources**
- [logs/routes.rs](file://apps/server/src/logs/routes.rs#L0-L7)
- [logs/handlers.rs](file://apps/server/src/logs/handlers.rs#L0-L86)
- [logs/models.rs](file://apps/server/src/logs/models.rs#L0-L47)

## 健康检查
提供服务健康状态的 API。

### 健康检查
- **HTTP 方法**: `GET`
- **路径**: `/health`
- **请求头**: 无
- **成功响应 (200)**: 返回 "OK" 或类似健康状态
- **其他状态码**: 500 (Internal Server Error)

**Section sources**
- [health/routes.rs](file://apps/server/src/health/routes.rs#L0-L5)
- [health/handlers.rs](file://apps/server/src/health/handlers.rs#L0-L10)