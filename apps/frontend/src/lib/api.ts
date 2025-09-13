import axios, { AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

// API 配置
// 开发环境使用Vite代理，生产环境使用环境变量
const API_BASE_URL = import.meta.env.DEV 
  ? '' // 开发环境使用相对路径，由Vite代理处理
  : (import.meta.env.VITE_API_URL || 'http://127.0.0.1:9080')

// 创建 axios 实例
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // CORS相关配置
  withCredentials: true, // 支持跨域请求中携带cookies
})

// 请求拦截器：添加认证token和检查token过期
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore.getState()
    const { accessToken, isTokenExpired, reset } = authStore.auth
    
    // 检查token是否过期
    if (accessToken && isTokenExpired()) {
      console.warn('Token已过期，清除认证状态')
      reset()
      // 可以在这里触发重新登录逻辑
      return Promise.reject(new Error('Token expired'))
    }
    
    // 添加认证头
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
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
      
      // 可以在这里触发登录弹窗或重定向到登录页
      // 注意：不要在这里直接操作路由，应该通过事件或回调处理
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

// 登录API
export const authApi = {
  login: (credentials: LoginRequest): Promise<AxiosResponse<LoginResponse>> => {
    return apiClient.post('/api/auth/login', credentials)
  },
  
  forgotPassword: (email: string): Promise<AxiosResponse<string>> => {
    return apiClient.post('/api/auth/forgot-password', { email })
  },
  
  resetPassword: (token: string, newPassword: string): Promise<AxiosResponse<string>> => {
    return apiClient.post('/api/auth/reset-password', { token, new_password: newPassword })
  },
  
  validateToken: (): Promise<AxiosResponse<string>> => {
    return apiClient.get('/api/auth/validate')
  },
  
  getCurrentUser: (): Promise<AxiosResponse<CurrentUserResponse>> => {
    return apiClient.get('/api/auth/me')
  }
}

export default apiClient