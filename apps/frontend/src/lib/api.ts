import { apiClient } from '@/lib/api-client'

// 登录请求接口
export interface LoginRequest {
  username: string
  password: string
}

// 用户响应接口
export interface UserResponse {
  id: string
  username: string
  email: string
  roles: string[]
}

// 登录响应接口
export interface LoginResponse {
  token: string
  user: UserResponse
  timestamp: number
  trace_id: string
}

// 当前用户响应接口
export interface CurrentUserResponse {
  id: string
  username: string
  email: string
  roles: string[]
  exp: number
}

// 忘记密码请求接口
export interface ForgotPasswordRequest {
  email: string
}

// 重置密码请求接口
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

/**
 * 认证相关API
 */
export const authApi = {
  /**
   * 用户登录
   */
  login: (data: LoginRequest) => 
    apiClient.post<LoginResponse>('/api/auth/login', data),
  
  /**
   * 获取当前用户信息
   */
  getCurrentUser: () => 
    apiClient.get<CurrentUserResponse>('/api/auth/me'),
  
  /**
   * 验证token有效性
   */
  validateToken: () => 
    apiClient.get('/api/auth/validate'),
  
  /**
   * 忘记密码
   */
  forgotPassword: (data: ForgotPasswordRequest) => 
    apiClient.post('/api/auth/forgot-password', data),
  
  /**
   * 重置密码
   */
  resetPassword: (data: ResetPasswordRequest) => 
    apiClient.post('/api/auth/reset-password', data),
}