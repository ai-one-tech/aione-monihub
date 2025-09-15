import { create } from 'zustand'
import { getCookie, setCookie, removeCookie, debugCookies, checkCookie, checkCookiePersistence } from '@/lib/cookies'

const ACCESS_TOKEN = 'aione_auth_token'
const USER_INFO = 'aione_user_info'

interface AuthUser {
  accountNo: string
  email: string
  role: string[]
  exp: number
}

interface AuthState {
  auth: {
    user: AuthUser | null
    isAuthenticated: boolean
    accessToken: string
    setUser: (user: AuthUser | null) => void
    setAccessToken: (accessToken: string) => void
    setLoginData: (token: string, user: AuthUser) => void
    resetAccessToken: () => void
    reset: () => void
    isTokenExpired: () => boolean
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  // 调试：显示初始化时的cookie状态
  if (import.meta.env.MODE === 'development') {
    console.log('🔐 Auth Store 初始化')
    checkCookiePersistence()
  }
  
  // 初始化时从cookie中恢复认证状态
  const initToken = getCookie(ACCESS_TOKEN) || ''
  const initUserInfo = getCookie(USER_INFO)
  let initUser: AuthUser | null = null
  
  if (import.meta.env.MODE === 'development') {
    console.log('初始化token:', initToken ? '✅ 存在' : '❌ 不存在')
    console.log('初始化用户信息:', initUserInfo ? '✅ 存在' : '❌ 不存在')
  }
  
  if (initUserInfo) {
    try {
      initUser = JSON.parse(initUserInfo)
      if (import.meta.env.MODE === 'development') {
        console.log('✅ 用户信息解析成功:', initUser)
      }
    } catch (error) {
      console.warn('❌ 解析用户信息失败:', error)
      removeCookie(USER_INFO)
    }
  }
  
  // 检查token和用户信息是否都存在来确定认证状态
  const isAuthenticated = !!(initToken && initUser && initUser.exp && Date.now() < initUser.exp)
  
  if (import.meta.env.MODE === 'development') {
    console.log('初始认证状态:', isAuthenticated ? '✅ 已认证' : '❌ 未认证')
    if (initUser?.exp) {
      const expTime = new Date(initUser.exp)
      const now = new Date()
      console.log('Token过期时间:', expTime.toLocaleString())
      console.log('当前时间:', now.toLocaleString())
      console.log('Token是否过期:', Date.now() >= initUser.exp ? '❌ 已过期' : '✅ 有效')
    }
  }
  
  return {
    auth: {
      user: initUser,
      isAuthenticated,
      accessToken: initToken,
      
      setUser: (user) =>
        set((state) => {
          if (user) {
            setCookie(USER_INFO, JSON.stringify(user), 7 * 24 * 60 * 60) // 7天
          } else {
            removeCookie(USER_INFO)
          }
          return { 
            ...state, 
            auth: { 
              ...state.auth, 
              user,
              isAuthenticated: !!(user && state.auth.accessToken)
            } 
          }
        }),
        
      setAccessToken: (accessToken) =>
        set((state) => {
          if (accessToken) {
            setCookie(ACCESS_TOKEN, accessToken, 7 * 24 * 60 * 60) // 7天
          } else {
            removeCookie(ACCESS_TOKEN)
          }
          return { 
            ...state, 
            auth: { 
              ...state.auth, 
              accessToken,
              isAuthenticated: !!(accessToken && state.auth.user)
            } 
          }
        }),
        
      setLoginData: (token, user) =>
        set((state) => {
          if (import.meta.env.MODE === 'development') {
            console.log('🔐 设置登录数据:', { token: token.substring(0, 20) + '...', user })
          }
          
          setCookie(ACCESS_TOKEN, token, 7 * 24 * 60 * 60) // 7天
          setCookie(USER_INFO, JSON.stringify(user), 7 * 24 * 60 * 60) // 7天
          
          // 验证cookie是否设置成功
          if (import.meta.env.MODE === 'development') {
            setTimeout(() => {
              const tokenCheck = checkCookie(ACCESS_TOKEN)
              const userCheck = checkCookie(USER_INFO)
              console.log('Cookie设置验证:', { token: tokenCheck, user: userCheck })
              if (!tokenCheck || !userCheck) {
                console.error('⚠️ Cookie设置可能失败，请检查浏览器设置')
                debugCookies()
              }
            }, 100)
          }
          
          return {
            ...state,
            auth: {
              ...state.auth,
              accessToken: token,
              user,
              isAuthenticated: true
            }
          }
        }),
        
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { 
            ...state, 
            auth: { 
              ...state.auth, 
              accessToken: '',
              isAuthenticated: false
            } 
          }
        }),
        
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          removeCookie(USER_INFO)
          return {
            ...state,
            auth: { 
              ...state.auth, 
              user: null, 
              accessToken: '',
              isAuthenticated: false
            },
          }
        }),
        
      isTokenExpired: () => {
        const { user } = get().auth
        if (!user || !user.exp) return true
        return Date.now() >= user.exp
      }
    },
  }
})