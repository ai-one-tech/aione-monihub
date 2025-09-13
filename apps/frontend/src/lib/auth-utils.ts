import { useAuthStore } from '@/stores/auth-store'
import { authApi } from '@/lib/api'

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
    } catch (error) {
      console.error('Token验证失败:', error)
      this.logout()
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
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      this.logout()
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
}