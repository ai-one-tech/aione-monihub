import { authToken } from './auth-token'
import { env } from '@/config/env'
import { generateSnowflakeId } from './snowflake'

/**
 * API客户端配置
 */
interface ApiClientConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
}

/**
 * 请求选项
 */
interface RequestOptions extends RequestInit {
  timeout?: number
  skipAuth?: boolean
  disableNetworkErrorHandling?: boolean // 禁用网络错误处理
}

/**
 * API响应类型
 */
interface ApiResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

/**
 * API错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 统一的API客户端
 */
class ApiClient {
  private config: Required<ApiClientConfig>

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    }
  }

  /**
   * 请求拦截器 - 自动添加认证头
   */
  private addAuthHeader(headers: Record<string, string>, skipAuth?: boolean): Record<string, string> {
    if (!skipAuth) {
      const authHeader = authToken.getAuthorizationHeader()
      if (authHeader) {
        headers['Authorization'] = authHeader
      }
    }
    return headers
  }

  /**
   * 响应拦截器 - 统一错误处理
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      // 优先尝试解析为结构化JSON对象
      try {
        const errorData = await response.clone().json()
        if (errorData && typeof errorData === 'object') {
          // 新格式优先取 message 字段；兼容旧格式的 error 字段
          if (typeof errorData.message === 'string' && errorData.message.length > 0) {
            errorMessage = errorData.message
          } else if (typeof errorData.error === 'string' && errorData.error.length > 0) {
            errorMessage = errorData.error
          }
        }
      } catch {
        // 如果JSON解析失败，尝试读取文本作为错误信息
        try {
          const text = await response.text()
          if (text && text.length > 0) {
            errorMessage = text
          }
        } catch {
          // 保留默认错误消息
        }
      }

      throw new ApiError(errorMessage, response.status, response)
    }

    // 成功分支：尽量解析为JSON对象；若失败回退为空对象
    let data: T
    try {
      data = await response.json()
    } catch {
      // 非JSON响应容错处理：返回空值或原始文本（按需）
      // 这里返回 undefined 以保持类型兼容
      data = undefined as unknown as T
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    }
  }

  /**
   * 创建带超时的fetch请求
   */
  private async fetchWithTimeout(url: string, options: RequestOptions): Promise<Response> {
    const { timeout = this.config.timeout, ...fetchOptions } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408)
      }
      throw error
    }
  }

  /**
   * 通用请求方法
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`

    // 合并headers，确保类型正确
    const headers: Record<string, string> = {}
    // 添加默认headers
    Object.entries(this.config.headers).forEach(([key, value]) => {
      headers[key] = value
    })
    // 添加options中的headers
    if (options.headers) {
      // 如果是Headers对象，转换为Record
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value
        })
      } else if (typeof options.headers === 'object') {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            headers[key] = value
          }
        })
      }
    }

    const authHeaders = this.addAuthHeader(headers, options.skipAuth)
    if (!authHeaders['x-trace-id']) {
      authHeaders['x-trace-id'] = generateSnowflakeId()
    }

    const requestOptions: RequestOptions = {
      credentials: 'include', // 包含cookie
      ...options,
      headers: authHeaders
    }

    try {
      const response = await this.fetchWithTimeout(url, requestOptions)
      return this.handleResponse<T>(response)
    } catch (error) {
      // 网络错误处理将在调用API的组件中进行
      throw error
    }
  }

  /**
   * 检查是否为网络错误
   */
  private isNetworkError(error: any): boolean {
    // TypeError通常是网络错误（如断网、DNS解析失败等）
    if (error instanceof TypeError) {
      return true
    }

    // AbortError是超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      return true
    }

    // 自定义的超时错误
    if (error instanceof ApiError && error.status === 408) {
      return true
    }

    return false
  }

  /**
   * GET请求
   */
  async get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async download(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<{ blob: Blob; fileName?: string; status: number; statusText: string; headers: Headers }> {
    const url = `${this.config.baseURL}${endpoint}`
    const headers: Record<string, string> = {}
    Object.entries(this.config.headers).forEach(([key, value]) => { headers[key] = value })
    if (options?.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => { headers[key] = value })
      } else if (typeof options.headers === 'object') {
        Object.entries(options.headers).forEach(([key, value]) => { if (typeof value === 'string') headers[key] = value })
      }
    }
    const authHeaders = this.addAuthHeader(headers, options?.skipAuth)
    const requestOptions: RequestOptions = { credentials: 'include', ...options, method: 'GET', headers: authHeaders }
    const response = await this.fetchWithTimeout(url, requestOptions)
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.clone().json()
        if (errorData && typeof errorData === 'object') {
          if (typeof errorData.message === 'string' && errorData.message.length > 0) {
            errorMessage = errorData.message
          } else if (typeof errorData.error === 'string' && errorData.error.length > 0) {
            errorMessage = errorData.error
          }
        }
      } catch {
        try {
          const text = await response.text()
          if (text && text.length > 0) { errorMessage = text }
        } catch { }
      }
      throw new ApiError(errorMessage, response.status, response)
    }
    const blob = await response.blob()
    const disp = response.headers.get('Content-Disposition') || ''
    let fileName: string | undefined
    const match = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(disp)
    if (match) {
      fileName = decodeURIComponent(match[1] || match[2])
    }
    return { blob, fileName, status: response.status, statusText: response.statusText, headers: response.headers }
  }

  /**
   * POST请求
   */
  async post<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * PUT请求
   */
  async put<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * 模拟网络错误 - 用于测试
   */
  async simulateNetworkError(): Promise<ApiResponse<any>> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TypeError('Failed to fetch'))
      }, 1000)
    })
  }
}

// 导出默认API客户端实例
export const apiClient = new ApiClient({ baseURL: env.API_URL })

// 导出类和类型
export { ApiClient, type ApiClientConfig, type RequestOptions, type ApiResponse }