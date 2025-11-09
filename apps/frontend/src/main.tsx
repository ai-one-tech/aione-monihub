import { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
import { NetworkErrorProvider, useNetworkError } from './context/network-error-context'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

// 创建一个全局的网络错误处理函数
let globalShowNetworkError: ((error: Error, retryFn: () => Promise<any>) => void) | null = null
let globalIsDialogOpen: boolean | null = null

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        // 检查是否为网络错误并显示全局错误弹窗
        if (isNetworkError(error) && globalShowNetworkError) {
          globalShowNetworkError(error, async () => {
            // 对于mutation，我们无法直接重试，需要用户手动重试
            toast.info('请手动重试操作')
          })
        }
        // 只有在网络错误弹窗未显示时才显示toast
        else if (!globalIsDialogOpen) {
          handleServerError(error)
        }

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('Content not modified!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      // 检查是否为网络错误并显示全局错误弹窗
      if (isNetworkError(error) && globalShowNetworkError) {
        // 获取失败的查询信息
        const queryInfo = queryClient.getQueryCache().getAll().find(q => q.state.error === error)
        if (queryInfo) {
          globalShowNetworkError(error, async () => {
            // 重试查询
            await queryClient.refetchQueries({ queryKey: queryInfo.queryKey })
          })
        }
      }
      // 只有在网络错误弹窗未显示时才显示toast
      else if (!globalIsDialogOpen) {
        if (error instanceof AxiosError) {
          if (error.response?.status === 500) {
            toast.error('Internal Server Error!')
            // 不再跳转到500页面，只显示错误提示
            // router.navigate({ to: '/500' })
          }
          if (error.response?.status === 403) {
            // router.navigate("/forbidden", { replace: true });
          }
        }
      }
    },
  }),
})

// 检查是否为网络错误
function isNetworkError(error: any): boolean {
  // Axios网络错误
  if (error instanceof AxiosError) {
    return !error.response || 
           error.code === 'ECONNABORTED' || 
           error.message.includes('Network Error')
  }
  
  // 原生fetch错误
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  
  // 其他网络相关错误
  return error.message?.includes('network') || 
         error.message?.includes('Network') ||
         error.message?.includes('timeout') ||
         error.message?.includes('Timeout')
}

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// 全局网络错误处理组件
function GlobalNetworkErrorHandler() {
  const { showError, isDialogOpen } = useNetworkError()
  
  useEffect(() => {
    globalShowNetworkError = showError
    globalIsDialogOpen = isDialogOpen
  }, [showError, isDialogOpen])
  
  return null
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <NetworkErrorProvider>
          <GlobalNetworkErrorHandler />
          <ThemeProvider>
            <FontProvider>
              <DirectionProvider>
                <RouterProvider router={router} />
              </DirectionProvider>
            </FontProvider>
          </ThemeProvider>
        </NetworkErrorProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}