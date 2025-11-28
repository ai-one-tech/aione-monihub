import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { authApi, CurrentUserResponse } from '@/lib/api'
import { ApiError } from '@/lib/api-client'
import { AuthUtils } from '@/lib/auth-utils'
import { useNetworkError } from '@/context/network-error-context'

interface UseAuthCheckResult {
  isAuthenticated: boolean
  isLoading: boolean
  user: CurrentUserResponse | null
  error: string | null
  showLoginDialog: boolean
  showNetworkError: boolean
  setShowLoginDialog: (show: boolean) => void
  setShowNetworkError: (show: boolean) => void
  checkAuth: () => Promise<void>
  handleLoginSuccess: () => void
  retryNetwork: () => Promise<void>
}

export function useAuthCheck(): UseAuthCheckResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<CurrentUserResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showNetworkError, setShowNetworkError] = useState(false)
  const [isPageRefresh, setIsPageRefresh] = useState(true)

  const navigate = useNavigate()
  const location = useLocation()
  const authStore = useAuthStore()
  const { showError } = useNetworkError()

  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 尝试恢复认证状态
      const isRestored = AuthUtils.checkAndRestoreAuth()

      // 使用AuthUtils检查是否已登录
      if (!AuthUtils.isAuthenticated() || !isRestored) {
        setIsAuthenticated(false)
        setUser(null)

        // 如果是页面刷新且没有登录，直接跳转到登录页面
        if (isPageRefresh) {
          const currentPath = location.href
          navigate({
            to: '/sign-in',
            search: { redirect: currentPath },
            replace: true,
          })
          return
        }

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
            exp: currentUser.exp,
          })
          setShowLoginDialog(false)
        }
      } else {
        // token无效
        setIsAuthenticated(false)
        setUser(null)

        // 如果是页面刷新且token无效，直接跳转到登录页面
        if (isPageRefresh) {
          const currentPath = location.href
          navigate({
            to: '/sign-in',
            search: { redirect: currentPath },
            replace: true,
          })
          return
        }
      }
    } catch (err: any) {
      if (!(err instanceof TypeError)) {
        console.error('身份验证检查失败:', err)
      }

      if (err instanceof ApiError) {
        if (err.status === 401) {
          setIsAuthenticated(false)
          setUser(null)
          setError('身份验证已过期，请重新登录')
          AuthUtils.logout()
          if (isPageRefresh) {
            const currentPath = location.href
            navigate({
              to: '/sign-in',
              search: { redirect: currentPath },
              replace: true,
            })
            return
          } else {
            setShowLoginDialog(true)
          }
        } else if (err.status === 500) {
          showError(err, async () => {
            await retryNetwork()
          })
        } else {
          setError(err.message || '身份验证检查失败')
        }
      } else {
        setError(err?.message || '身份验证检查失败')
      }
    } finally {
      setIsLoading(false)
      // 标记不再是页面刷新状态
      if (isPageRefresh) {
        setIsPageRefresh(false)
      }
    }
  }, [isPageRefresh, location.href, navigate])

  const retryNetwork = useCallback(async () => {
    setShowNetworkError(false)
    await checkAuth()
  }, [checkAuth])

  const handleLoginSuccess = useCallback(async () => {
    setShowLoginDialog(false)
    // 登录成功后重新检查认证状态
    await checkAuth()
  }, [checkAuth])

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // 监听API错误事件
  useEffect(() => {
    const handleApiAuthError = (event: CustomEvent) => {
      const { status, message } = event.detail
      if (status === 401) {
        console.log('API返回401错误，显示登录弹窗')
        setIsAuthenticated(false)
        setUser(null)
        setError(message)
        setShowLoginDialog(true)
      }
    }

    window.addEventListener(
      'api-auth-error',
      handleApiAuthError as EventListener
    )

    return () => {
      window.removeEventListener(
        'api-auth-error',
        handleApiAuthError as EventListener
      )
    }
  }, [])

  // 监听认证状态变化
  useEffect(() => {
    // 直接使用authStore监听变化
    const currentState = authStore.auth.isAuthenticated
    if (!currentState) {
      setIsAuthenticated(false)
      setUser(null)
    } else {
      // 如果认证状态为true，更新本地状态
      setIsAuthenticated(true)
      const currentUser = AuthUtils.getCurrentUser()
      if (currentUser) {
        setUser({
          id: currentUser.accountNo,
          username: 'admin', // 这里需要从API获取
          email: currentUser.email,
          roles: currentUser.role,
          exp: currentUser.exp,
        })
      }
    }
  }, [authStore.auth.isAuthenticated])

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    showLoginDialog,
    showNetworkError,
    setShowLoginDialog,
    setShowNetworkError,
    checkAuth,
    handleLoginSuccess,
    retryNetwork,
  }
}
