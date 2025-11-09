import { useCallback, useState, useRef, useEffect } from 'react'
import { useNetworkError } from '@/context/network-error-context'
import { AxiosError } from 'axios'
import { ApiError } from '@/lib/api-client'
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
        
        // 仅在500错误时显示全局错误弹窗，其余错误使用toast
        if (!options.disableNetworkErrorHandling && shouldShowErrorDialog(err)) {
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

  // 仅在500错误时弹窗
  const shouldShowErrorDialog = (error: any): boolean => {
    if (error instanceof AxiosError) {
      return (error.response?.status ?? 0) === 500
    }
    if (error instanceof ApiError) {
      return error.status === 500
    }
    return false
  }

  const reset = useCallback(() => {
    setLoading(false)
    setData(null)
    setError(null)
  }, [])

  return { callApi, loading, data, error, reset }
}