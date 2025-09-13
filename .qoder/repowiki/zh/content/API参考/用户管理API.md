# 用户管理API

<cite>
**本文档中引用的文件**  
- [models.rs](file://apps/server/src/users/models.rs)
- [handlers.rs](file://apps/server/src/users/handlers.rs)
- [routes.rs](file://apps/server/src/users/routes.rs)
- [schema.ts](file://apps/frontend/src/features/users/data/schema.ts)
</cite>

## 目录
1. [简介](#简介)
2. [API端点概览](#api端点概览)
3. [请求头要求](#请求头要求)
4. [核心数据模型](#核心数据模型)
5. [获取用户列表 (GET /api/users)](#获取用户列表-get-apiusers)
6. [创建用户 (POST /api/users)](#创建用户-post-apiusers)
7. [获取单个用户 (GET /api/users/{id})](#获取单个用户-get-apiusersid)
8. [更新用户 (PUT /api/users/{id})](#更新用户-put-apiusersid)
9. [删除用户 (DELETE /api/users/{id})](#删除用户-delete-apiusersid)
10. [错误码说明](#错误码说明)
11. [权限与验证规则](#权限与验证规则)
12. [客户端调用示例](#客户端调用示例)

## 简介
本API文档详细描述了用户管理模块的所有RESTful端点。该模块支持用户生命周期的完整管理，包括创建、读取、更新和删除操作。所有端点均需要身份验证和管理员权限，确保系统安全。

**Section sources**
- [handlers.rs](file://apps/server/src/users/handlers.rs#L1-L212)

## API端点概览
用户管理模块提供以下RESTful端点：

| HTTP方法 | 路径 | 描述 |
|---------|------|------|
| GET | `/api/users` | 获取用户列表（支持分页、搜索和过滤） |
| POST | `/api/users` | 创建新用户 |
| GET | `/api/users/{id}` | 根据ID获取单个用户信息 |
| PUT | `/api/users/{id}` | 根据ID更新用户信息 |
| DELETE | `/api/users/{id}` | 根据ID删除用户 |

**Section sources**
- [routes.rs](file://apps/server/src/users/routes.rs#L1-L12)

## 请求头要求
所有API请求必须包含以下请求头：

- `Authorization: Bearer <token>` - JWT身份验证令牌
- `Content-Type: application/json` - 请求体为JSON格式

未提供有效Bearer令牌的请求将返回401 Unauthorized错误。

**Section sources**
- [auth/handlers.rs](file://apps/server/src/auth/handlers.rs#L1-L29)

## 核心数据模型
本节定义了用户管理API使用的核心数据结构。

### UserCreateRequest (创建用户请求体)
用于创建新用户的请求体结构。

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "status": "active|inactive|invited|suspended"
}
```

**Section sources**
- [models.rs](file://apps/server/src/users/models.rs#L28-L34)

### UserUpdateRequest (更新用户请求体)
用于更新现有用户的请求体结构。

```json
{
  "username": "string",
  "email": "string",
  "status": "active|inactive|invited|suspended"
}
```

**Section sources**
- [models.rs](file://apps/server/src/users/models.rs#L36-L41)

### UserResponse (用户响应)
API返回的用户信息结构。

```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "status": "string",
  "created_at": "string",
  "updated_at": "string"
}
```

**Section sources**
- [models.rs](file://apps/server/src/users/models.rs#L14-L21)

### UserListResponse (用户列表响应)
获取用户列表时返回的分页响应结构。

```json
{
  "data": [
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "status": "string",
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

**Section sources**
- [models.rs](file://apps/server/src/users/models.rs#L43-L54)

### UserListQuery (查询参数)
获取用户列表时支持的查询参数。

| 参数 | 类型 | 是否必需 | 描述 |
|------|------|----------|------|
| page | integer | 否 | 页码（默认为1） |
| limit | integer | 否 | 每页数量（默认为10） |
| search | string | 否 | 搜索关键字（按用户名或邮箱搜索） |
| status | string | 否 | 状态过滤（active, inactive, invited, suspended） |

**Section sources**
- [models.rs](file://apps/server/src/users/models.rs#L56-L66)

## 获取用户列表 (GET /api/users)
获取分页的用户列表，支持搜索和过滤功能。

### 请求示例
```bash
curl -X GET "http://localhost:8080/api/users?page=1&limit=10&search=admin&status=active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 响应示例
```json
{
  "data": [
    {
      "id": "1",
      "username": "admin",
      "email": "admin@example.com",
      "status": "active",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  },
  "timestamp": 1700000000,
  "trace_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Section sources**
- [handlers.rs](file://apps/server/src/users/handlers.rs#L1-L25)
- [models.rs](file://apps/server/src/users/models.rs#L43-L54)

## 创建用户 (POST /api/users)
创建一个新用户。

### 请求示例
```bash
curl -X POST "http://localhost:8080/api/users" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "status": "active"
  }'
```

### 响应示例
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "status": "active",
  "created_at": "2023-12-15T10:30:00Z",
  "updated_at": "2023-12-15T10:30:00Z"
}
```

**Section sources**
- [handlers.rs](file://apps/server/src/users/handlers.rs#L27-L58)
- [models.rs](file://apps/server/src/users/models.rs#L28-L34)

## 获取单个用户 (GET /api/users/{id})
根据用户ID获取单个用户的信息。

### 请求示例
```bash
curl -X GET "http://localhost:8080/api/users/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 响应示例
```json
{
  "id": "1",
  "username": "admin",
  "email": "admin@example.com",
  "status": "active",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

**Section sources**
- [handlers.rs](file://apps/server/src/users/handlers.rs#L60-L85)
- [models.rs](file://apps/server/src/users/models.rs#L14-L21)

## 更新用户 (PUT /api/users/{id})
根据用户ID更新用户信息。

### 请求示例
```bash
curl -X PUT "http://localhost:8080/api/users/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_updated",
    "email": "admin_updated@example.com",
    "status": "active"
  }'
```

### 响应示例
```json
{
  "id": "1",
  "username": "admin_updated",
  "email": "admin_updated@example.com",
  "status": "active",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-12-15T11:00:00Z"
}
```

**Section sources**
- [handlers.rs](file://apps/server/src/users/handlers.rs#L87-L118)
- [models.rs](file://apps/server/src/users/models.rs#L36-L41)

## 删除用户 (DELETE /api/users/{id})
根据用户ID删除用户。

### 请求示例
```bash
curl -X DELETE "http://localhost:8080/api/users/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 响应示例
```json
"User deleted successfully"
```

**Section sources**
- [handlers.rs](file://apps/server/src/users/handlers.rs#L120-L135)

## 错误码说明
API可能返回以下HTTP状态码：

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 400 | Bad Request | 请求格式错误或参数验证失败 |
| 401 | Unauthorized | 未提供身份验证令牌或令牌无效 |
| 403 | Forbidden | 用户权限不足，无法执行操作 |
| 404 | Not Found | 请求的资源不存在（如用户ID不存在） |
| 422 | Unprocessable Entity | 请求语义正确但无法处理（如业务规则验证失败） |
| 500 | Internal Server Error | 服务器内部错误 |

**Section sources**
- [shared/error.rs](file://apps/server/src/shared/error.rs#L1-L76)

## 权限与验证规则
### 权限要求
- 所有用户管理API端点都需要有效的Bearer Token身份验证
- 只有管理员角色（admin或superadmin）的用户才能访问这些端点
- 普通用户将收到403 Forbidden响应

### 数据验证规则
- **用户名**: 必需，长度3-50字符，只能包含字母、数字、下划线和连字符
- **邮箱**: 必需，必须是有效的电子邮件格式
- **密码**: 创建用户时必需，长度至少8字符
- **状态**: 必须是以下值之一：`active`, `inactive`, `invited`, `suspended`
- **ID参数**: 路径参数{id}必须是有效的字符串标识符

**Section sources**
- [schema.ts](file://apps/frontend/src/features/users/data/schema.ts#L1-L32)
- [models.rs](file://apps/server/src/users/models.rs#L28-L41)

## 客户端调用示例
### JavaScript Fetch 调用示例
```javascript
// 获取用户列表
async function getUsers() {
  const response = await fetch('/api/users?page=1&limit=10', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log(data);
  } else {
    console.error('获取用户失败:', response.status);
  }
}

// 创建用户
async function createUser() {
  const userData = {
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'password123',
    status: 'active'
  };
  
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  if (response.ok) {
    const newUser = await response.json();
    console.log('用户创建成功:', newUser);
  } else {
    console.error('用户创建失败:', response.status);
  }
}
```

**Section sources**
- [schema.ts](file://apps/frontend/src/features/users/data/schema.ts#L1-L32)