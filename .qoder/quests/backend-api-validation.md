# 后端API验证文档

## 1. 概述

本文档用于验证 AiOne MoniHub 后端 API 的可用性。后端服务基于 Rust + Actix Web 构建，包含多个功能模块，每个模块提供一组 RESTful API 端点。

## 2. API模块结构

根据代码分析，后端 API 包含以下模块：

1. 健康检查 (Health)
2. 认证 (Authentication)
3. 用户管理 (Users)
4. 项目管理 (Projects)
5. 应用管理 (Applications)
6. 配置管理 (Configs)
7. 部署管理 (Deployments)
8. 角色管理 (Roles)
9. 权限管理 (Permissions)
10. 机器管理 (Machines)
11. 日志管理 (Logs)
12. WebSocket 通信 (WebSocket)

## 3. API验证计划

### 3.1 健康检查模块
- 端点: `GET /health`
- 功能: 检查服务健康状态

### 3.2 认证模块
- 端点: `POST /api/auth/login`
- 功能: 用户登录认证
- 端点: `POST /api/auth/forgot-password`
- 功能: 忘记密码
- 端点: `POST /api/auth/reset-password`
- 功能: 重置密码

### 3.3 用户管理模块
- 端点: `GET /api/users`
- 功能: 获取用户列表
- 端点: `POST /api/users`
- 功能: 创建用户
- 端点: `GET /api/users/{id}`
- 功能: 获取特定用户信息
- 端点: `PUT /api/users/{id}`
- 功能: 更新用户信息
- 端点: `DELETE /api/users/{id}`
- 功能: 删除用户
- 端点: `POST /api/users/{id}/disable`
- 功能: 禁用用户
- 端点: `POST /api/users/{id}/enable`
- 功能: 启用用户

### 3.4 项目管理模块
- 端点: `GET /api/projects`
- 功能: 获取项目列表
- 端点: `POST /api/projects`
- 功能: 创建项目
- 端点: `GET /api/projects/{id}`
- 功能: 获取特定项目信息
- 端点: `PUT /api/projects/{id}`
- 功能: 更新项目信息
- 端点: `DELETE /api/projects/{id}`
- 功能: 删除项目

### 3.5 应用管理模块
- 端点: `GET /api/applications`
- 功能: 获取应用列表
- 端点: `POST /api/applications`
- 功能: 创建应用
- 端点: `GET /api/applications/{id}`
- 功能: 获取特定应用信息
- 端点: `PUT /api/applications/{id}`
- 功能: 更新应用信息
- 端点: `DELETE /api/applications/{id}`
- 功能: 删除应用

### 3.6 配置管理模块
- 端点: `GET /api/configs`
- 功能: 获取配置列表
- 端点: `POST /api/configs`
- 功能: 创建配置
- 端点: `GET /api/configs/code/{code}`
- 功能: 根据代码获取配置
- 端点: `GET /api/configs/code/{code}/environment/{environment}`
- 功能: 根据代码和环境获取配置
- 端点: `GET /api/configs/code/{code}/environment/{environment}/version/{version}`
- 功能: 根据代码、环境和版本获取配置
- 端点: `DELETE /api/configs/{id}`
- 功能: 删除配置

### 3.7 部署管理模块
- 端点: `GET /api/deployments`
- 功能: 获取部署列表
- 端点: `POST /api/deployments`
- 功能: 创建部署
- 端点: `GET /api/deployments/{id}`
- 功能: 获取特定部署信息
- 端点: `PUT /api/deployments/{id}`
- 功能: 更新部署信息
- 端点: `DELETE /api/deployments/{id}`
- 功能: 删除部署
- 端点: `GET /api/deployments/{id}/monitoring`
- 功能: 获取部署监控信息
- 端点: `GET /api/deployments/{id}/files`
- 功能: 获取部署文件列表
- 端点: `POST /api/deployments/{id}/files/upload`
- 功能: 上传文件
- 端点: `GET /api/deployments/{id}/files/{file_path:.*}`
- 功能: 下载文件
- 端点: `DELETE /api/deployments/{id}/files/{file_path:.*}`
- 功能: 删除文件

### 3.8 角色管理模块
- 端点: `GET /api/roles`
- 功能: 获取角色列表
- 端点: `POST /api/roles`
- 功能: 创建角色
- 端点: `GET /api/roles/{id}`
- 功能: 获取特定角色信息
- 端点: `PUT /api/roles/{id}`
- 功能: 更新角色信息
- 端点: `DELETE /api/roles/{id}`
- 功能: 删除角色

### 3.9 权限管理模块
- 端点: `GET /api/permissions`
- 功能: 获取权限列表
- 端点: `POST /api/permissions/assign`
- 功能: 分配权限
- 端点: `POST /api/permissions/revoke`
- 功能: 撤销权限

### 3.10 机器管理模块
- 端点: `GET /api/machines`
- 功能: 获取机器列表
- 端点: `POST /api/machines`
- 功能: 创建机器
- 端点: `GET /api/machines/{id}`
- 功能: 获取特定机器信息
- 端点: `PUT /api/machines/{id}`
- 功能: 更新机器信息
- 端点: `DELETE /api/machines/{id}`
- 功能: 删除机器
- 端点: `GET /api/machines/{id}/monitoring-data`
- 功能: 获取机器监控数据

### 3.11 日志管理模块
- 端点: `GET /api/logs`
- 功能: 获取日志列表
- 端点: `GET /api/logs/export`
- 功能: 导出日志

### 3.12 WebSocket通信模块
- 端点: `GET /api/websocket/terminal/{deployment_id}`
- 功能: 终端WebSocket连接

## 4. 验证方法

1. 使用 API 测试工具（如 Postman、curl）发送请求到各个端点
2. 验证响应状态码是否符合预期
3. 验证响应数据格式是否正确
4. 记录测试结果和发现的问题

## 5. 验证结果

### 5.1 健康检查模块验证
- [ ] `GET /health` - 待验证

### 5.2 认证模块验证
- [ ] `POST /api/auth/login` - 待验证
- [ ] `POST /api/auth/forgot-password` - 待验证
- [ ] `POST /api/auth/reset-password` - 待验证

### 5.3 用户管理模块验证
- [ ] `GET /api/users` - 待验证
- [ ] `POST /api/users` - 待验证
- [ ] `GET /api/users/{id}` - 待验证
- [ ] `PUT /api/users/{id}` - 待验证
- [ ] `DELETE /api/users/{id}` - 待验证
- [ ] `POST /api/users/{id}/disable` - 待验证
- [ ] `POST /api/users/{id}/enable` - 待验证

### 5.4 项目管理模块验证
- [ ] `GET /api/projects` - 待验证
- [ ] `POST /api/projects` - 待验证
- [ ] `GET /api/projects/{id}` - 待验证
- [ ] `PUT /api/projects/{id}` - 待验证
- [ ] `DELETE /api/projects/{id}` - 待验证

### 5.5 应用管理模块验证
- [ ] `GET /api/applications` - 待验证
- [ ] `POST /api/applications` - 待验证
- [ ] `GET /api/applications/{id}` - 待验证
- [ ] `PUT /api/applications/{id}` - 待验证
- [ ] `DELETE /api/applications/{id}` - 待验证

### 5.6 配置管理模块验证
- [ ] `GET /api/configs` - 待验证
- [ ] `POST /api/configs` - 待验证
- [ ] `GET /api/configs/code/{code}` - 待验证
- [ ] `GET /api/configs/code/{code}/environment/{environment}` - 待验证
- [ ] `GET /api/configs/code/{code}/environment/{environment}/version/{version}` - 待验证
- [ ] `DELETE /api/configs/{id}` - 待验证

### 5.7 部署管理模块验证
- [ ] `GET /api/deployments` - 待验证
- [ ] `POST /api/deployments` - 待验证
- [ ] `GET /api/deployments/{id}` - 待验证
- [ ] `PUT /api/deployments/{id}` - 待验证
- [ ] `DELETE /api/deployments/{id}` - 待验证
- [ ] `GET /api/deployments/{id}/monitoring` - 待验证
- [ ] `GET /api/deployments/{id}/files` - 待验证
- [ ] `POST /api/deployments/{id}/files/upload` - 待验证
- [ ] `GET /api/deployments/{id}/files/{file_path:.*}` - 待验证
- [ ] `DELETE /api/deployments/{id}/files/{file_path:.*}` - 待验证

### 5.8 角色管理模块验证
- [ ] `GET /api/roles` - 待验证
- [ ] `POST /api/roles` - 待验证
- [ ] `GET /api/roles/{id}` - 待验证
- [ ] `PUT /api/roles/{id}` - 待验证
- [ ] `DELETE /api/roles/{id}` - 待验证

### 5.9 权限管理模块验证
- [ ] `GET /api/permissions` - 待验证
- [ ] `POST /api/permissions/assign` - 待验证
- [ ] `POST /api/permissions/revoke` - 待验证

### 5.10 机器管理模块验证
- [ ] `GET /api/machines` - 待验证
- [ ] `POST /api/machines` - 待验证
- [ ] `GET /api/machines/{id}` - 待验证
- [ ] `PUT /api/machines/{id}` - 待验证
- [ ] `DELETE /api/machines/{id}` - 待验证
- [ ] `GET /api/machines/{id}/monitoring-data` - 待验证

### 5.11 日志管理模块验证
- [ ] `GET /api/logs` - 待验证
- [ ] `GET /api/logs/export` - 待验证

### 5.12 WebSocket通信模块验证
- [ ] `GET /api/websocket/terminal/{deployment_id}` - 待验证