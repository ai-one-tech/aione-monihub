# 前端认证功能使用指南

## 概述

本项目已经实现了完整的前端认证功能，包括：
- 登录状态管理
- 本地持久化存储
- 自动API请求认证
- Token过期处理
- 角色权限检查

## 核心组件

### 1. AuthStore (认证状态管理)

```typescript
import { useAuthStore } from '@/stores/auth-store'

// 获取认证状态
const { auth } = useAuthStore()

// 检查是否已登录
const isLoggedIn = auth.isAuthenticated

// 获取当前用户
const currentUser = auth.user

// 获取访问token
const token = auth.accessToken

// 登录成功后设置数据
auth.setLoginData(token, userData)

// 退出登录
auth.reset()
```

### 2. AuthUtils (认证工具类)

```typescript
import { AuthUtils } from '@/lib/auth-utils'

// 检查是否已登录
if (AuthUtils.isAuthenticated()) {
  console.log('用户已登录')
}

// 获取当前用户
const user = AuthUtils.getCurrentUser()

// 检查用户角色
if (AuthUtils.hasRole('admin')) {
  console.log('用户是管理员')
}

// 检查多个角色
if (AuthUtils.hasAnyRole(['admin', 'moderator'])) {
  console.log('用户有管理权限')
}

// 验证token有效性
const isValid = await AuthUtils.validateToken()

// 退出登录
AuthUtils.logout()

// 获取token剩余时间
const timeRemaining = AuthUtils.getTokenTimeRemainingFormatted()
```

### 3. API客户端自动认证

```typescript
import apiClient from '@/lib/api'

// 所有API请求都会自动携带认证头
const response = await apiClient.get('/api/users')
// 请求头会自动包含: Authorization: Bearer <token>

// 如果token过期，会自动清除认证状态并返回错误
```

## 使用场景

### 1. 在组件中检查登录状态

```typescript
import { useAuthStore } from '@/stores/auth-store'
import { AuthUtils } from '@/lib/auth-utils'

export function MyComponent() {
  const { auth } = useAuthStore()
  
  if (!auth.isAuthenticated) {
    return <div>请先登录</div>
  }
  
  return (
    <div>
      <h1>欢迎, {auth.user?.email}</h1>
      <p>您的角色: {auth.user?.role.join(', ')}</p>
    </div>
  )
}
```

### 2. 路由保护

```typescript
import { AuthUtils } from '@/lib/auth-utils'
import { Navigate } from '@tanstack/react-router'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!AuthUtils.isAuthenticated()) {
    return <Navigate to="/sign-in" />
  }
  
  return <>{children}</>
}
```

### 3. 角色权限控制

```typescript
import { AuthUtils } from '@/lib/auth-utils'

export function AdminPanel() {
  if (!AuthUtils.hasRole('admin')) {
    return <div>您没有权限访问此页面</div>
  }
  
  return (
    <div>
      <h1>管理员面板</h1>
      {/* 管理员功能 */}
    </div>
  )
}
```

### 4. 条件渲染基于权限

```typescript
import { AuthUtils } from '@/lib/auth-utils'

export function UserActions() {
  return (
    <div>
      <button>查看资料</button>
      
      {AuthUtils.hasRole('moderator') && (
        <button>编辑内容</button>
      )}
      
      {AuthUtils.hasRole('admin') && (
        <button>删除用户</button>
      )}
    </div>
  )
}
```

### 5. 手动调用API

```typescript
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

export function LoginForm() {
  const { auth } = useAuthStore()
  
  const handleLogin = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials)
      const { token, user } = response.data
      
      // 保存登录数据到本地
      auth.setLoginData(token, {
        accountNo: user.id,
        email: user.email,
        role: user.roles,
        exp: Date.now() + 24 * 60 * 60 * 1000
      })
      
      console.log('登录成功')
    } catch (error) {
      console.error('登录失败:', error)
    }
  }
}
```

## 数据存储

### 本地存储方式
- **Cookie存储**: 认证token和用户信息存储在Cookie中
- **过期时间**: 默认7天，可配置
- **自动清理**: token过期或登出时自动清理

### 存储的数据
```typescript
// Cookie: aione_auth_token
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// Cookie: aione_user_info
{
  "accountNo": "user123",
  "email": "user@example.com", 
  "role": ["user", "admin"],
  "exp": 1640995200000
}
```

## 错误处理

### Token过期
- 自动检测token过期时间
- 过期时自动清除认证状态
- 弹出登录提示

### 网络错误
- 401错误: 自动退出登录
- 403错误: 权限不足提示
- 500错误: 服务器错误提示
- 超时错误: 网络超时提示

### 错误监听
```typescript
import { apiClient } from '@/lib/api'

// API客户端会自动处理认证错误
// 401错误会自动触发logout
```

## 安全特性

1. **Token验证**: 每次请求自动验证token有效性
2. **过期检查**: 前端主动检查token过期时间
3. **自动清理**: 异常情况下自动清理认证数据
4. **HTTPS支持**: 生产环境建议使用HTTPS
5. **同源检查**: 跨窗口通信时进行同源检查

## 最佳实践

1. **及时更新**: 定期调用`AuthUtils.refreshUserInfo()`更新用户信息
2. **错误处理**: 始终处理API调用的认证错误
3. **权限检查**: 在敏感操作前检查用户权限
4. **安全退出**: 提供明确的退出登录功能
5. **状态同步**: 使用认证状态管理避免状态不一致

## 故障排除

### 常见问题

1. **登录后立即退出**
   - 检查token格式是否正确
   - 确认服务器时间与客户端时间同步

2. **API请求401错误**
   - 确认token是否正确设置
   - 检查token是否过期

3. **权限检查失败**
   - 确认用户角色数据格式
   - 检查角色名称是否匹配

4. **状态不同步**
   - 刷新页面重新加载状态
   - 检查Cookie是否被正确设置