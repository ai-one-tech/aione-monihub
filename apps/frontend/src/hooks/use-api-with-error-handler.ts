import { useCallback, useState, useRef, useEffect } from 'react'
import { useNetworkError } from '@/context/network-error-context'
import { toast } from 'sonner'

interface ApiCallOptions {
  disableNetworkErrorHandling?: boolean
  retryOnError?: boolean
}

interface UseApiWithErrorHandlerReturn<T> {
  callApi: (apiCall: () => Promise<T>, options?: ApiCallOptions) => Promise<T | null>
  loading: boolean
  data: T | null
  error: Error | null
  reset: () => void
}

export function useApiWithErrorHandler<T>(): UseApiWithErrorHandlerReturn<T> {
  const { showError, isDialogOpen } = useNetworkError()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)

  // 清理函数，组件卸载时设置isMounted为false
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const callApi = useCallback(
    async (
      apiCall: () => Promise<T>,
      options: ApiCallOptions = {}
    ): Promise<T | null> => {
      // 组件已卸载，不执行API调用
      if (!isMountedRef.current) {
        return null
      }

      setLoading(true)
      setError(null)
      
      try {
        const result = await apiCall()
        // 组件已卸载，不更新状态
        if (!isMountedRef.current) {
          return result
        }
        
        setData(result)
        return result
      } catch (err: any) {
        // 组件已卸载，不更新状态
        if (!isMountedRef.current) {
          throw err
        }
        
        setError(err)
        
        // 如果不是禁用网络错误处理，且是网络错误，则显示全局错误弹窗
        if (!options.disableNetworkErrorHandling && isNetworkError(err)) {
          showError(err, async () => {
            // 重试API调用
            return callApi(apiCall, { ...options, disableNetworkErrorHandling: true })
          })
        }
        // 只有在网络错误弹窗未显示时才显示toast
        else if (!isDialogOpen) {
          toast.error(err.message || '请求失败')
        }
        
        throw err
      } finally {
        // 组件已卸载，不更新状态
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    },
    [showError, isDialogOpen]
  )

  // 检查是否为网络错误
  const isNetworkError = (error: any): boolean => {
    // TypeError通常是网络错误（如断网、DNS解析失败等）
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      return true
    }
    
    // AbortError是超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      return true
    }
    
    // Axios错误中的网络错误
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('Network Error')) {
      return true
    }
    
    // 其他网络相关错误
    return error?.message?.includes('network') || 
           error?.message?.includes('Network') ||
           error?.message?.includes('timeout') ||
           error?.message?.includes('Timeout')
  }

  const reset = useCallback(() => {
    setLoading(false)
    setData(null)
    setError(null)
  }, [])

  return { callApi, loading, data, error, reset }
}