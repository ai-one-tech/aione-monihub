import { useState, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface NetworkErrorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRetry: () => Promise<void>
}

export function NetworkErrorDialog({
  open,
  onOpenChange,
  onRetry,
}: NetworkErrorDialogProps) {
  const navigate = useNavigate()
  const [isRetrying, setIsRetrying] = useState(false)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  const handleRetry = async () => {
    if (retryCountRef.current >= maxRetries) {
      // 超过最大重试次数，显示错误信息
      return
    }

    setIsRetrying(true)
    try {
      await onRetry()
      retryCountRef.current = 0 // 重置重试计数
    } catch (error) {
      retryCountRef.current++
      console.error('Retry failed:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleCancel = () => {
    retryCountRef.current = 0
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()} // 禁用点击外部关闭
        onEscapeKeyDown={(e) => e.preventDefault()} // 禁用ESC键关闭
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='text-destructive h-5 w-5' />
            服务器内部错误
          </DialogTitle>
          <DialogDescription>
            服务器暂时不可用或出现错误，请稍后重试。
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-4'>
          <div className='flex justify-center'>
            <div className='text-muted-foreground text-center text-sm'>
              <p>可能的原因：</p>
              <ul className='mt-1 list-inside list-disc text-left'>
                <li>后端服务故障或重启</li>
                <li>服务异常导致请求失败</li>
                <li>临时维护或高负载</li>
              </ul>
            </div>
          </div>

          {retryCountRef.current > 0 && (
            <div className='text-center text-sm text-yellow-600'>
              重试 {retryCountRef.current}/{maxRetries}
            </div>
          )}

          {retryCountRef.current >= maxRetries ? (
            <div className='flex flex-col gap-2'>
              <div className='text-destructive text-center text-sm'>
                已达到最大重试次数，请检查网络连接后重试
              </div>
              <div className='mt-4 flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => navigate({ to: '/' })}
                  className='flex-1'
                >
                  返回首页
                </Button>
                <Button
                  onClick={() => {
                    retryCountRef.current = 0
                    handleRetry()
                  }}
                  className='flex-1'
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  重新尝试
                </Button>
              </div>
            </div>
          ) : (
            <div className='mt-4 flex gap-2'>
              <Button
                variant='outline'
                onClick={() => navigate({ to: '/' })}
                className='flex-1'
              >
                返回首页
              </Button>
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className='flex-1'
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                    重试中...
                  </>
                ) : (
                  <>
                    <RefreshCw className='mr-2 h-4 w-4' />
                    重新加载
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
