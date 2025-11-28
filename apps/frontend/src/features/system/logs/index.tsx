import { getRouteApi } from '@tanstack/react-router'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Main } from '@/components/layout/main'
import { logsApi } from './api/logs-api'
import { SystemLogsTable } from './components/system-logs-table'
import { useLogsQuery } from './hooks/use-logs-query'

const route = getRouteApi('/_authenticated/logs/system')

export function SystemLogs() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const apiParams = {
    page: search.page ?? DEFAULT_PAGE,
    limit: search.pageSize ?? DEFAULT_PAGE_SIZE,
    log_level: search.log_level || undefined,
    keyword: search.keyword || undefined,
    source: search.source || undefined,
    log_type: 'system',
    user_id: search.user_id || undefined,
    agent_instance_id: search.agent_instance_id || undefined,
    instance_id: search.instance_id || undefined,
    application_id: (search as any).application_id || undefined,
    trace_id: search.trace_id || undefined,
  }

  const { data, isLoading, error, refetch } = useLogsQuery(apiParams)
  const exportUrl = logsApi.getExportUrl(apiParams)

  return (
    <Main fixed className='flex flex-col'>
      <div className='mb-2 flex flex-shrink-0 flex-wrap items-center justify-between space-y-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>系统日志</h2>
          <p className='text-muted-foreground'>
            查看并筛选系统日志，默认按时间降序
          </p>
        </div>
      </div>
      <div className='min-h-0 flex-1 overflow-hidden py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-64 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        ) : error ? (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              加载日志失败：{error.message}
              <button onClick={() => refetch()} className='ml-2 underline'>
                重试
              </button>
            </AlertDescription>
          </Alert>
        ) : (
          <SystemLogsTable
            data={data?.data || []}
            totalPages={Math.ceil(
              (data?.pagination?.total || 0) /
                (data?.pagination?.limit ||
                  (search.pageSize ?? DEFAULT_PAGE_SIZE))
            )}
            search={search}
            navigate={navigate as any}
            exportUrl={exportUrl}
            onRefresh={refetch}
          />
        )}
      </div>
    </Main>
  )
}

export default SystemLogs
