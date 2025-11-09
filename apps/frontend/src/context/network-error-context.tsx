import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { NetworkErrorDialog } from '@/components/network-error-dialog'
import { setNetworkErrorDialogOpen } from '@/lib/handle-server-error'

interface NetworkErrorContextType {
  showError: (error: Error, retryFn: () => Promise<any>) => void
  hideError: () => void
  isDialogOpen: boolean // 添加一个状态来跟踪弹窗是否打开
}

const NetworkErrorContext = createContext<NetworkErrorContextType | undefined>(undefined)

export function NetworkErrorProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const retryFnRef = useRef<(() => Promise<any>) | null>(null)
  const errorRef = useRef<Error | null>(null)
  const pendingRetriesRef = useRef<Array<() => Promise<any>>>([])
  const errorCountRef = useRef(0)

  // 当弹窗状态改变时，更新全局状态
  useEffect(() => {
    setNetworkErrorDialogOpen(isOpen)
  }, [isOpen])

  const showError = useCallback((error: Error, retryFn: () => Promise<any>) => {
    // 只有在网络错误时才显示弹窗
    if (isNetworkError(error)) {
      errorRef.current = error
      // 将重试函数添加到待处理列表中
      pendingRetriesRef.current.push(retryFn)
      
      // 增加错误计数
      errorCountRef.current += 1
      
      // 如果弹窗还没有打开，则打开它
      if (!isOpen) {
        // 取第一个重试函数作为主要重试函数
        retryFnRef.current = retryFn
        setIsOpen(true)
      }
    }
  }, [isOpen])

  const hideError = useCallback(() => {
    setIsOpen(false)
    retryFnRef.current = null
    errorRef.current = null
    pendingRetriesRef.current = []
    errorCountRef.current = 0
  }, [])

  const handleRetry = useCallback(async () => {
    try {
      // 并行执行所有待处理的重试函数
      if (pendingRetriesRef.current.length > 0) {
        await Promise.all(pendingRetriesRef.current.map(fn => fn()))
      } else if (retryFnRef.current) {
        await retryFnRef.current()
      }
      
      // 重试成功后隐藏弹窗
      hideError()
    } catch (error) {
      // 如果重试仍然失败，保持弹窗打开
      console.error('Retry failed:', error)
      // 可以在这里添加重试失败的通知
    }
  }, [hideError])

  // 检查是否为网络错误
  const isNetworkError = (error: Error): boolean => {
    // Axios错误
    if ((error as any).isAxiosError) {
      const axiosError = error as any
      // 网络错误或超时
      return !axiosError.response || 
             axiosError.code === 'ECONNABORTED' || 
             axiosError.message.includes('Network Error')
    }
    
    // 原生fetch错误
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      return true
    }
    
    // AbortError是超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      return true
    }
    
    // 其他网络相关错误
    return error.message.includes('network') || 
           error.message.includes('Network') ||
           error.message.includes('timeout') ||
           error.message.includes('Timeout') ||
           error.message.includes('Failed to fetch')
  }

  // 获取当前错误数量
  const getErrorCount = useCallback(() => {
    return errorCountRef.current
  }, [])

  return (
    <NetworkErrorContext.Provider value={{ showError, hideError, isDialogOpen: isOpen }}>
      {children}
      <NetworkErrorDialog 
        open={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) {
            hideError()
          }
        }}
        onRetry={handleRetry}
      />
    </NetworkErrorContext.Provider>
  )
}

export function useNetworkError() {
  const context = useContext(NetworkErrorContext)
  if (context === undefined) {
    throw new Error('useNetworkError must be used within a NetworkErrorProvider')
  }
  return context
}