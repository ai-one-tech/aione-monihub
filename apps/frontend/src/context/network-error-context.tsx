import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { NetworkErrorDialog } from '@/components/network-error-dialog'
import { setNetworkErrorDialogOpen } from '@/lib/handle-server-error'
import { AxiosError } from 'axios'
import { ApiError } from '@/lib/api-client'

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
    // 仅在服务器500错误时显示弹窗
    if (shouldShowErrorDialog(error)) {
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

  // 仅在500错误时显示弹窗
  const shouldShowErrorDialog = (error: Error): boolean => {
    if (error instanceof AxiosError) {
      return (error.response?.status ?? 0) === 500
    }
    if (error instanceof ApiError) {
      return error.status === 500
    }
    return false
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