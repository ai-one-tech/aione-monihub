import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

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
  // 初始化时从cookie中恢复认证状态
  const initToken = getCookie(ACCESS_TOKEN) || ''
  const initUserInfo = getCookie(USER_INFO)
  let initUser: AuthUser | null = null
  
  if (initUserInfo) {
    try {
      initUser = JSON.parse(initUserInfo)
    } catch (error) {
      console.warn('解析用户信息失败:', error)
      removeCookie(USER_INFO)
    }
  }
  
  return {
    auth: {
      user: initUser,
      isAuthenticated: !!initToken && !!initUser,
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
          setCookie(ACCESS_TOKEN, token, 7 * 24 * 60 * 60) // 7天
          setCookie(USER_INFO, JSON.stringify(user), 7 * 24 * 60 * 60) // 7天
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
