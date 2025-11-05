import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useTaskDetails, useTaskResults } from '../hooks/use-application-tasks'
import type { TaskResult } from '../data/api-schema'

interface ApplicationTaskResultListProps {
  taskId: string
  onViewDetails: (result: TaskResult) => void
}

export function ApplicationTaskResultList({
  taskId,
  onViewDetails,
}: ApplicationTaskResultListProps) {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { data: task, isLoading: taskLoading } = useTaskDetails(taskId)
  const { data: results, isLoading: resultsLoading, refetch } = useTaskResults(taskId)

  // Auto refresh every 3 seconds if enabled and task is not completed
  useEffect(() => {
    if (!autoRefresh || !task) return

    const hasIncompleteResults = results?.some(
      (r) => r.status === 'pending' || r.status === 'running'
    )

    if (!hasIncompleteResults) {
      setAutoRefresh(false)
      return
    }

    const interval = setInterval(() => {
      refetch()
    }, 3000)

    return () => clearInterval(interval)
  }, [autoRefresh, task, results, refetch])

  if (taskLoading || resultsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!task || !results) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">无法加载任务信息</p>
      </div>
    )
  }

  const statusCounts = {
    success: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'failed').length,
    running: results.filter((r) => r.status === 'running').length,
    pending: results.filter((r) => r.status === 'pending').length,
  }

  const totalInstances = results.length
  const completedCount = statusCounts.success + statusCounts.failed
  const progressPercent = totalInstances > 0 ? (completedCount / totalInstances) * 100 : 0

  return (
    <div className="flex flex-col h-full">
      {/* Summary */}
      <div className="space-y-4 mb-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">任务进度</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} / {totalInstances}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="grid grid-cols-4 gap-2">
          <StatusCard
            label="成功"
            count={statusCounts.success}
            variant="success"
            icon={CheckCircle2}
          />
          <StatusCard
            label="失败"
            count={statusCounts.failed}
            variant="destructive"
            icon={XCircle}
          />
          <StatusCard
            label="执行中"
            count={statusCounts.running}
            variant="default"
            icon={Loader2}
            animate
          />
          <StatusCard label="等待" count={statusCounts.pending} variant="secondary" icon={Clock} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">任务名称:</span>
            <span className="font-medium">{task.task_name}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAutoRefresh(true)
              refetch()
            }}
            disabled={autoRefresh}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', autoRefresh && 'animate-spin')} />
            {autoRefresh ? '自动刷新中' : '手动刷新'}
          </Button>
        </div>
      </div>

      {/* Results List */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-2">
          {results.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              onViewDetails={() => onViewDetails(result)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

interface StatusCardProps {
  label: string
  count: number
  variant: 'success' | 'destructive' | 'default' | 'secondary'
  icon: React.ElementType
  animate?: boolean
}

function StatusCard({ label, count, variant, icon: Icon, animate = false }: StatusCardProps) {
  const variantColors = {
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    destructive: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    default: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    secondary: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
  }

  const iconColors = {
    success: 'text-green-600 dark:text-green-400',
    destructive: 'text-red-600 dark:text-red-400',
    default: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-gray-600 dark:text-gray-400',
  }

  return (
    <div className={cn('border rounded-lg p-3 text-center', variantColors[variant])}>
      <Icon className={cn('h-5 w-5 mx-auto mb-1', iconColors[variant], animate && 'animate-spin')} />
      <div className="text-2xl font-bold mb-0.5">{count}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

interface ResultCardProps {
  result: TaskResult
  onViewDetails: () => void
}

function ResultCard({ result, onViewDetails }: ResultCardProps) {
  const statusConfig = {
    pending: {
      label: '等待执行',
      variant: 'secondary' as const,
      icon: Clock,
      color: 'text-gray-600',
    },
    running: {
      label: '执行中',
      variant: 'default' as const,
      icon: Loader2,
      color: 'text-blue-600',
      animate: true,
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

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', status.color, status.animate && 'animate-spin')} />
          <div>
            <div className="font-medium text-sm">{result.instance_id}</div>
            <div className="text-xs text-muted-foreground font-mono">{result.instance_id}</div>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {result.status === 'running' && result.started_at && (
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">执行时间</div>
          <div className="text-sm">{formatDuration(result.started_at)}</div>
        </div>
      )}

      {result.status === 'success' && (
        <div className="space-y-2 mb-3">
          {result.completed_at && (
            <div>
              <div className="text-xs text-muted-foreground">完成时间</div>
              <div className="text-sm">{new Date(result.completed_at).toLocaleString()}</div>
            </div>
          )}
          {result.result_data && (
            <div>
              <div className="text-xs text-muted-foreground">执行结果</div>
              <div className="text-sm font-mono bg-muted p-2 rounded mt-1 max-h-20 overflow-hidden">
                {truncateText(JSON.stringify(result.result_data, null, 2), 100)}
              </div>
            </div>
          )}
        </div>
      )}

      {result.status === 'failed' && result.error_message && (
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">错误信息</div>
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {truncateText(result.error_message, 150)}
          </div>
        </div>
      )}

      {(result.status === 'success' || result.status === 'failed') && (
        <Button variant="outline" size="sm" className="w-full" onClick={onViewDetails}>
          <Eye className="h-4 w-4 mr-2" />
          查看详情
        </Button>
      )}
    </div>
  )
}

function formatDuration(startTime: string): string {
  const start = new Date(startTime).getTime()
  const now = Date.now()
  const diff = now - start

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `已执行 ${hours} 小时 ${minutes % 60} 分钟`
  } else if (minutes > 0) {
    return `已执行 ${minutes} 分钟 ${seconds % 60} 秒`
  } else {
    return `已执行 ${seconds} 秒`
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
