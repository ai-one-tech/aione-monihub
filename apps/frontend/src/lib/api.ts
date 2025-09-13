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

// 请求拦截器：添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore.getState()
    const token = authStore.auth.accessToken
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：处理认证错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除认证状态
      const authStore = useAuthStore.getState()
      authStore.auth.reset()
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
  }
}

export default apiClient