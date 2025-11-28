import { CheckCircle2, XCircle, Clock, AlertCircle, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TaskRecord } from '../data/api-schema'

interface ApplicationTaskResultDialogProps {
  result: TaskRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRetry?: (recordId: string) => void
}

export function ApplicationTaskResultDialog({
  result,
  open,
  onOpenChange,
  onRetry,
}: ApplicationTaskResultDialogProps) {
  if (!result) return null

  const statusConfig = {
    pending: {
      label: '等待执行',
      variant: 'secondary' as const,
      icon: Clock,
      color: 'text-gray-600',
    },
    dispatched: {
      label: '已下发',
      variant: 'default' as const,
      icon: Clock,
      color: 'text-blue-600',
    },
    running: {
      label: '执行中',
      variant: 'default' as const,
      icon: Clock,
      color: 'text-blue-600',
    },
    success: {
      label: '成功',
      variant: 'success' as const,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    failed: {
      label: '失败',
      variant: 'destructive' as const,
      icon: XCircle,
      color: 'text-red-600',
    },
  }

  const status = statusConfig[result.status] || statusConfig.pending
  const Icon = status.icon

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  const handleRetry = () => {
    if (onRetry && result.id) {
      onRetry(result.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-3xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Icon className={cn('h-5 w-5', status.color)} />
            <span>任务执行详情</span>
          </DialogTitle>
          <DialogDescription>实例: {result.instance_id}</DialogDescription>
        </DialogHeader>

        <ScrollArea className='max-h-[calc(90vh-120px)] pr-4'>
          <div className='space-y-6'>
            {/* Status */}
            <div>
              <h3 className='mb-2 text-sm font-medium'>执行状态</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            {/* Basic Info */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <h3 className='mb-2 text-sm font-medium'>实例ID</h3>
                <div className='flex items-center gap-2'>
                  <code className='bg-muted flex-1 rounded px-2 py-1 text-sm'>
                    {result.instance_id}
                  </code>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleCopy(result.instance_id)}
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {result.task_id && (
                <div>
                  <h3 className='mb-2 text-sm font-medium'>任务ID</h3>
                  <div className='flex items-center gap-2'>
                    <code className='bg-muted flex-1 truncate rounded px-2 py-1 text-sm'>
                      {result.task_id}
                    </code>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleCopy(result.task_id || '')}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Time Info */}
            <div className='grid grid-cols-2 gap-4'>
              {result.dispatched_at && (
                <div>
                  <h3 className='mb-2 text-sm font-medium'>下发时间</h3>
                  <p className='text-muted-foreground text-sm'>
                    {new Date(result.dispatched_at).toLocaleString()}
                  </p>
                </div>
              )}

              {result.started_at && (
                <div>
                  <h3 className='mb-2 text-sm font-medium'>开始时间</h3>
                  <p className='text-muted-foreground text-sm'>
                    {new Date(result.started_at).toLocaleString()}
                  </p>
                </div>
              )}

              {result.completed_at && (
                <div>
                  <h3 className='mb-2 text-sm font-medium'>完成时间</h3>
                  <p className='text-muted-foreground text-sm'>
                    {new Date(result.completed_at).toLocaleString()}
                  </p>
                </div>
              )}

              {result.started_at && result.completed_at && (
                <div>
                  <h3 className='mb-2 text-sm font-medium'>执行时长</h3>
                  <p className='text-muted-foreground text-sm'>
                    {formatDuration(result.started_at, result.completed_at)}
                  </p>
                </div>
              )}
            </div>

            {/* Result Data */}
            {result.result_data && (
              <div>
                <div className='mb-2 flex items-center justify-between'>
                  <h3 className='text-sm font-medium'>执行结果</h3>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      handleCopy(JSON.stringify(result.result_data, null, 2))
                    }
                  >
                    <Copy className='mr-2 h-4 w-4' />
                    复制
                  </Button>
                </div>
                <pre className='bg-muted overflow-x-auto rounded p-4 text-xs'>
                  {JSON.stringify(result.result_data, null, 2)}
                </pre>
              </div>
            )}

            {/* Error Message */}
            {result.error_message && (
              <div>
                <div className='mb-2 flex items-center justify-between'>
                  <h3 className='flex items-center gap-2 text-sm font-medium'>
                    <AlertCircle className='text-destructive h-4 w-4' />
                    错误信息
                  </h3>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleCopy(result.error_message || '')}
                  >
                    <Copy className='mr-2 h-4 w-4' />
                    复制
                  </Button>
                </div>
                <div className='text-destructive bg-destructive/10 rounded p-4 text-sm whitespace-pre-wrap'>
                  {result.error_message}
                </div>
              </div>
            )}

            {/* Retry Info */}
            {result.retry_count !== undefined && result.retry_count > 0 && (
              <div>
                <h3 className='mb-2 text-sm font-medium'>重试信息</h3>
                <p className='text-muted-foreground text-sm'>
                  已重试 {result.retry_count} 次
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className='flex items-center justify-end gap-2 border-t pt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          {result.status === 'failed' && onRetry && (
            <Button onClick={handleRetry}>重试任务</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const diff = end - start

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours} 小时 ${minutes % 60} 分钟 ${seconds % 60} 秒`
  } else if (minutes > 0) {
    return `${minutes} 分钟 ${seconds % 60} 秒`
  } else {
    return `${seconds} 秒`
  }
}
