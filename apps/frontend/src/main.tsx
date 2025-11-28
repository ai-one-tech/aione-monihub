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
import { ApiError } from '@/lib/api-client'
import { handleServerError } from '@/lib/handle-server-error'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import {
  NetworkErrorProvider,
  useNetworkError,
} from './context/network-error-context'
import { ThemeProvider } from './context/theme-provider'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

// 创建一个全局的网络错误处理函数
let globalShowNetworkError:
  | ((error: Error, retryFn: () => Promise<any>) => void)
  | null = null
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
        // 仅在500错误时显示全局错误弹窗，其余错误使用toast
        if (shouldShowErrorDialog(error) && globalShowNetworkError) {
          globalShowNetworkError(error as Error, async () => {
            // 对于mutation，我们无法直接重试，需要用户手动重试
            toast.info('请手动重试操作')
          })
        } else if (!globalIsDialogOpen) {
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
      // 仅在500错误时显示全局错误弹窗，其余错误使用toast
      if (shouldShowErrorDialog(error) && globalShowNetworkError) {
        // 获取失败的查询信息
        const queryInfo = queryClient
          .getQueryCache()
          .getAll()
          .find((q) => q.state.error === error)
        if (queryInfo) {
          globalShowNetworkError(error as Error, async () => {
            // 重试查询
            await queryClient.refetchQueries({ queryKey: queryInfo.queryKey })
          })
        }
      } else if (!globalIsDialogOpen) {
        // 401处理：清理认证并通知显示登录弹窗
        if (
          error instanceof AxiosError
            ? error.response?.status === 401
            : (error as any)?.status === 401
        ) {
          try {
            const store = useAuthStore.getState()
            store.auth.reset()
          } catch {}
          window.dispatchEvent(
            new CustomEvent('api-auth-error', {
              detail: { status: 401, message: '身份验证已过期，请重新登录' },
            })
          )
        }
        handleServerError(error)
      }
    },
  }),
})

// 仅在500错误时显示弹窗
function shouldShowErrorDialog(error: any): boolean {
  if (error instanceof AxiosError) {
    return (error.response?.status ?? 0) === 500
  }
  if (error instanceof ApiError) {
    return error.status === 500
  }
  return false
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
