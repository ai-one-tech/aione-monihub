import { useState, useEffect, useCallback } from 'react'
import { authApi, CurrentUserResponse } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { AuthUtils } from '@/lib/auth-utils'

interface UseAuthCheckResult {
  isAuthenticated: boolean
  isLoading: boolean
  user: CurrentUserResponse | null
  error: string | null
  showLoginDialog: boolean
  setShowLoginDialog: (show: boolean) => void
  checkAuth: () => Promise<void>
  handleLoginSuccess: () => void
}

export function useAuthCheck(): UseAuthCheckResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<CurrentUserResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  
  const authStore = useAuthStore()

  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // 使用AuthUtils检查是否已登录
      if (!AuthUtils.isAuthenticated()) {
        setIsAuthenticated(false)
        setUser(null)
        setShowLoginDialog(true)
        return
      }
      
      // 尝试刷新用户信息以验证token
      const isValid = await AuthUtils.refreshUserInfo()
      
      if (isValid) {
        const currentUser = AuthUtils.getCurrentUser()
        if (currentUser) {
          setIsAuthenticated(true)
          setUser({
            id: currentUser.accountNo,
            username: 'admin', // 这里需要从API获取
            email: currentUser.email,
            roles: currentUser.role,
            exp: currentUser.exp
          })
          setShowLoginDialog(false)
        }
      } else {
        // token无效，显示登录弹窗
        setIsAuthenticated(false)
        setUser(null)
        setShowLoginDialog(true)
      }
    } catch (err: any) {
      console.error('身份验证检查失败:', err)
      
      if (err.response?.status === 401) {
        // Token无效或过期
        setIsAuthenticated(false)
        setUser(null)
        setError('身份验证已过期，请重新登录')
        setShowLoginDialog(true)
        AuthUtils.logout()
      } else {
        // 其他错误
        setError(err.message || '身份验证检查失败')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleLoginSuccess = useCallback(async () => {
    setShowLoginDialog(false)
    // 登录成功后重新检查认证状态
    await checkAuth()
  }, [checkAuth])

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // 监听认证状态变化
  useEffect(() => {
    // 直接使用authStore监听变化
    const currentState = authStore.auth.isAuthenticated
    if (!currentState) {
      setIsAuthenticated(false)
      setUser(null)
    }
  }, [authStore.auth.isAuthenticated])

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    showLoginDialog,
    setShowLoginDialog,
    checkAuth,
    handleLoginSuccess
  }
}