import { getCookie, setCookie, deleteCookie } from './cookie-utils'

/**
 * 认证Token管理工具
 */
class AuthTokenManager {
  private readonly TOKEN_COOKIE_NAME = 'aione_auth_token'
  private readonly TOKEN_STORAGE_KEY = 'aione_auth_token'

  /**
   * 获取认证token
   * 优先从cookie获取，如果没有则从localStorage获取
   */
  getToken(): string | null {
    // 优先从cookie获取
    let token = getCookie(this.TOKEN_COOKIE_NAME)
    
    if (!token) {
      // 备用方案：从localStorage获取
      token = localStorage.getItem(this.TOKEN_STORAGE_KEY)
    }
    
    return token
  }

  /**
   * 设置认证token
   * 同时存储到cookie和localStorage
   */
  setToken(token: string, options?: {
    expires?: Date
    maxAge?: number
    path?: string
  }): void {
    // 存储到cookie
    setCookie(this.TOKEN_COOKIE_NAME, token, {
      path: '/',
      maxAge: 24 * 60 * 60, // 默认24小时
      sameSite: 'Lax',
      ...options
    })
    
    // 备用存储到localStorage
    localStorage.setItem(this.TOKEN_STORAGE_KEY, token)
  }

  /**
   * 清除认证token
   */
  clearToken(): void {
    // 清除cookie
    deleteCookie(this.TOKEN_COOKIE_NAME, '/')
    
    // 清除localStorage
    localStorage.removeItem(this.TOKEN_STORAGE_KEY)
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    const token = this.getToken()
    return !!token && token !== '{{TOKEN}}'
  }

  /**
   * 获取Authorization头部值
   */
  getAuthorizationHeader(): string | null {
    const token = this.getToken()
    return token ? `Bearer ${token}` : null
  }
}

// 导出单例实例
export const authToken = new AuthTokenManager()

// 导出类型和工具函数
export type { AuthTokenManager }
export const getAuthToken = () => authToken.getToken()
export const setAuthToken = (token: string, options?: Parameters<AuthTokenManager['setToken']>[1]) => 
  authToken.setToken(token, options)
export const clearAuthToken = () => authToken.clearToken()
export const isAuthenticated = () => authToken.isAuthenticated()
export const getAuthorizationHeader = () => authToken.getAuthorizationHeader()