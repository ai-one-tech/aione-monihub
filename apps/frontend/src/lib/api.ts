import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

// 创建 axios 实例
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:9080',
  timeout: 10000, // 10秒超时
  withCredentials: true, // 允许携带cookie
})

// 请求拦截器：添加认证头
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore.getState()
    const token = authStore.auth.accessToken
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加 CSRF token（如果存在）
    const csrfToken = getCookie('csrf_token')
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
    
    return config
  },
  (error) => {
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：处理认证错误和其他错误
apiClient.interceptors.response.use(
  (response) => {
    // 请求成功，直接返回响应
    return response
  },
  (error) => {
    const authStore = useAuthStore.getState()
    
    if (error.response?.status === 401) {
      // Token 过期或无效，清除认证状态
      console.warn('收到401错误，清除认证状态')
      authStore.auth.reset()
      
      // 发出全局事件，通知显示登录弹窗
      window.dispatchEvent(new CustomEvent('api-auth-error', {
        detail: { status: 401, message: '身份验证已过期，请重新登录' }
      }))
    } else if (error.response?.status === 403) {
      console.warn('没有权限访问此资源')
    } else if (error.response?.status >= 500) {
      console.error('服务器错误:', error.response.status)
    } else if (error.code === 'ECONNABORTED') {
      console.error('请求超时')
    } else if (!error.response) {
      console.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

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