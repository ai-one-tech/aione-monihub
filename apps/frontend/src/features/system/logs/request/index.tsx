import { getRouteApi } from '@tanstack/react-router'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Main } from '@/components/layout/main'
import { logsApi } from '../api/logs-api'
import { useLogsQuery } from '../hooks/use-logs-query'
import { RequestLogsTable } from './components/request-logs-table'

const route = getRouteApi('/_authenticated/logs/requests')

export function RequestLogs() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const apiParams = {
    page: search.page ?? DEFAULT_PAGE,
    limit: search.pageSize ?? DEFAULT_PAGE_SIZE,
    keyword: search.keyword || undefined,
    url: search.url || undefined,
    method: search.method || undefined,
    status: search.status || undefined,
    trace_id: search.trace_id || undefined,
    log_type: 'request',
  }

  const { data, isLoading, error, refetch } = useLogsQuery(apiParams as any)
  const exportUrl = logsApi.getExportUrl(apiParams as any)

  return (
    <Main fixed className='flex flex-col'>
      <div className='mb-2 flex flex-shrink-0 flex-wrap items-center justify-between space-y-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>请求日志</h2>
          <p className='text-muted-foreground'>
            按 URL、方法与状态码筛选查看请求日志
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
              加载日志失败：{(error as any)?.message}
              <button onClick={() => refetch()} className='ml-2 underline'>
                重试
              </button>
            </AlertDescription>
          </Alert>
        ) : (
          <RequestLogsTable
            data={data?.data || []}
            totalPages={Math.ceil(
              (data?.pagination?.total || 0) /
                (data?.pagination?.limit ||
                  (search.pageSize ?? DEFAULT_PAGE_SIZE))
            )}
            search={search as any}
            navigate={navigate as any}
            exportUrl={exportUrl}
            onRefresh={refetch}
          />
        )}
      </div>
    </Main>
  )
}

export default RequestLogs
