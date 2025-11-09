import { useAuthStore } from '@/stores/auth-store'
import { authApi } from '@/lib/api'
import { ApiError } from '@/lib/api-client'

/**
 * 认证工具类
 * 提供常用的认证操作方法
 */
export class AuthUtils {
  /**
   * 检查用户是否已登录
   */
  static isAuthenticated(): boolean {
    const authStore = useAuthStore.getState()
    return authStore.auth.isAuthenticated && !authStore.auth.isTokenExpired()
  }

  /**
   * 获取当前用户信息
   */
  static getCurrentUser() {
    const authStore = useAuthStore.getState()
    return authStore.auth.user
  }

  /**
   * 获取当前访问token
   */
  static getAccessToken(): string {
    const authStore = useAuthStore.getState()
    return authStore.auth.accessToken
  }

  /**
   * 检查用户是否有指定角色
   */
  static hasRole(role: string): boolean {
    const user = this.getCurrentUser()
    return user?.role?.includes(role) || false
  }

  /**
   * 检查用户是否有任意一个指定角色
   */
  static hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser()
    if (!user?.role) return false
    return roles.some(role => user.role.includes(role))
  }

  /**
   * 检查用户是否有所有指定角色
   */
  static hasAllRoles(roles: string[]): boolean {
    const user = this.getCurrentUser()
    if (!user?.role) return false
    return roles.every(role => user.role.includes(role))
  }

  /**
   * 退出登录
   */
  static logout(): void {
    const authStore = useAuthStore.getState()
    authStore.auth.reset()
  }

  /**
   * 验证当前token是否有效
   */
  static async validateToken(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false
      }
      
      const response = await authApi.validateToken()
      return response.status === 200
    } catch (error: any) {
      console.error('Token验证失败:', error)
      // 只有401错误才需要登出。其他错误（如网络错误）不转变为登出
      if (error.response?.status === 401) {
        this.logout()
      }
      return false
    }
  }

  /**
   * 刷新用户信息
   */
  static async refreshUserInfo(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false
      }
      
      const response = await authApi.getCurrentUser()
      if (response.status === 200) {
        const authStore = useAuthStore.getState()
        const userData = {
          accountNo: response.data.id,
          email: response.data.email,
          role: response.data.roles,
          exp: response.data.exp * 1000, // 转换为毫秒
        }
        authStore.auth.setUser(userData)
        return true
      }
      return false
    } catch (error: any) {
      console.error('刷新用户信息失败:', error)
      // 401：登出并返回失败；500：上抛给调用方走全局弹窗；其他：返回失败
      if (error instanceof ApiError) {
        if (error.status === 401) {
          this.logout()
          return false
        }
        if (error.status === 500) {
          throw error
        }
        return false
      }
      return false
    }
  }

  /**
   * 获取token剩余有效时间（毫秒）
   */
  static getTokenTimeRemaining(): number {
    const user = this.getCurrentUser()
    if (!user?.exp) return 0
    return Math.max(0, user.exp - Date.now())
  }

  /**
   * 获取token剩余有效时间（格式化字符串）
   */
  static getTokenTimeRemainingFormatted(): string {
    const timeRemaining = this.getTokenTimeRemaining()
    if (timeRemaining <= 0) return '已过期'
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }
  
  /**
   * 检查认证状态并尝试恢复
   */
  static checkAndRestoreAuth(): boolean {
    const authStore = useAuthStore.getState()
    const { accessToken, user } = authStore.auth
    
    // 检查是否存在token和用户信息
    if (!accessToken || !user) {
      return false
    }
    
    // 检查token是否过期
    if (authStore.auth.isTokenExpired()) {
      this.logout()
      return false
    }
    
    // 更新认证状态
    authStore.auth.setAccessToken(accessToken)
    authStore.auth.setUser(user)
    
    return true
  }
}