# 认证过期处理功能说明

## 功能概述

这个功能实现了当用户会话过期时的自动检测和处理流程：

1. **后端API**: 添加了获取当前用户信息的接口 `/api/auth/me`
2. **前端检测**: 自动检测用户认证状态
3. **弹窗提示**: 当认证过期时弹出登录提示弹窗
4. **新窗口登录**: 点击登录按钮在新窗口打开登录页面
5. **窗口通信**: 登录完成后自动关闭新窗口和弹窗

## 实现文件

### 后端文件
- `apps/server/src/auth/handlers.rs`: 添加了 `get_current_user` 处理器
- `apps/server/src/auth/models.rs`: 添加了 `CurrentUserResponse` 模型
- `apps/server/src/auth/routes.rs`: 添加了 `/api/auth/me` 路由

### 前端文件
- `apps/frontend/src/lib/api.ts`: 添加了 `getCurrentUser` API调用
- `apps/frontend/src/components/auth/login-dialog.tsx`: 登录弹窗组件
- `apps/frontend/src/hooks/use-auth-check.tsx`: 认证检查钩子
- `apps/frontend/src/components/layout/authenticated-layout.tsx`: 集成认证检查
- `apps/frontend/src/features/auth/sign-in/components/user-auth-form.tsx`: 新窗口登录支持

## 使用方法

### 启动服务
1. 启动后端服务：
```bash
cd apps/server
cargo run
```

2. 启动前端服务：
```bash
cd apps/frontend
npm run dev
```

### 测试流程
1. 访问前端应用（通常在 http://localhost:5173）
2. 如果未登录，会自动显示登录弹窗
3. 点击"前往登录"按钮，会在新窗口打开登录页面
4. 在新窗口中输入用户名 `admin` 和密码 `password` 进行登录
5. 登录成功后，新窗口自动关闭，主窗口的弹窗也会关闭

## API接口

### GET /api/auth/me
获取当前已登录用户的信息

**请求头**:
```
Authorization: Bearer <token>
```

**成功响应 (200)**:
```json
{
  "id": "user_id",
  "username": "admin",
  "email": "admin@example.com",
  "roles": ["admin"],
  "exp": 1672531200
}
```

**失败响应 (401)**:
```json
"Invalid or expired token"
```

## 技术特性

1. **自动检测**: 使用 React Hook 自动检测认证状态
2. **错误处理**: 401错误自动触发登录流程
3. **窗口通信**: 使用 postMessage API 实现窗口间通信
4. **状态管理**: 集成 Zustand 状态管理
5. **用户体验**: 平滑的加载状态和错误提示

## 安全考虑

1. **Token验证**: 后端验证JWT token的有效性和过期时间
2. **同源检查**: postMessage只接受同源的消息
3. **自动清理**: 超时自动清理事件监听器和窗口引用
4. **错误隔离**: 认证错误不影响其他功能

## 注意事项

1. 确保后端服务在端口 9080 上运行
2. 前端开发服务器需要配置代理（已在 vite.config.ts 中配置）
3. 默认的测试用户名是 `admin`，密码是 `password`
4. 生产环境需要替换 JWT_SECRET 并使用环境变量

## 扩展功能

未来可以考虑的扩展：
1. 自动刷新 token
2. 记住登录状态
3. 多因素认证支持
4. 社交登录集成
5. 登录日志记录