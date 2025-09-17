import { authToken } from './auth-token'

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
      console.log('添加认证头 Authorization:', authHeader)
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

      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // 如果响应不是JSON格式，使用默认错误消息
      }

      throw new ApiError(errorMessage, response.status, response)
    }

    const data = await response.json()
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

    const headers = this.addAuthHeader(
      { ...this.config.headers, ...options.headers },
      options.skipAuth
    )

    const requestOptions: RequestOptions = {
      credentials: 'include', // 包含cookie
      ...options,
      headers
    }

    const response = await this.fetchWithTimeout(url, requestOptions)
    return this.handleResponse<T>(response)
  }

  /**
   * GET请求
   */
  async get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
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
}

// 导出默认API客户端实例
export const apiClient = new ApiClient()

// 导出类和类型
export { ApiClient, type ApiClientConfig, type RequestOptions, type ApiResponse }