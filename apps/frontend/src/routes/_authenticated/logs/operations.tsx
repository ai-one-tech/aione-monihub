import z from 'zod'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useOperationLogsQuery } from '@/features/system/logs/operations/hooks/use-operations-logs-query'
import { OperationsLogsTable } from '@/features/system/logs/operations/components/operations-logs-table'

const searchSchema = z.object({
  page: z.number().optional().catch(DEFAULT_PAGE),
  pageSize: z.number().optional().catch(DEFAULT_PAGE_SIZE),
  user: z.string().optional().catch(''),
  ip: z.string().optional().catch(''),
  trace_id: z.string().optional().catch(''),
  table: z.string().optional().catch(''),
  operation: z.string().optional().catch(''),
  start_date: z.string().optional().catch(''),
  end_date: z.string().optional().catch(''),
})

function OperationsLogsPage() {
  const route = getRouteApi('/_authenticated/logs/operations')
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const apiParams = {
    page: (search as any).page || DEFAULT_PAGE,
    limit: (search as any).pageSize || DEFAULT_PAGE_SIZE,
    user: (search as any).user || undefined,
    ip: (search as any).ip || undefined,
    trace_id: (search as any).trace_id || undefined,
    table: (search as any).table || undefined,
    operation: (search as any).operation || undefined,
    start_date: (search as any).start_date || undefined,
    end_date: (search as any).end_date || undefined,
  }

  const { data, isLoading, error, refetch } = useOperationLogsQuery(apiParams)

  return (
    <Main fixed className='flex flex-col'>
      <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 flex-shrink-0'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>操作日志</h2>
          <p className='text-muted-foreground'>查看所有数据的新增、更新、删除操作</p>
        </div>
      </div>
      <div className='flex-1 min-h-0 overflow-hidden py-1'>
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
              加载失败：{(error as any).message}
              <button onClick={() => refetch()} className='ml-2 underline'>重试</button>
            </AlertDescription>
          </Alert>
        ) : (
          <OperationsLogsTable
            data={data?.data || []}
            totalPages={Math.ceil((data?.pagination?.total || 0) / (data?.pagination?.limit || ((search as any).pageSize || 10)))}
            search={search}
            navigate={navigate as any}
          />
        )}
      </div>
    </Main>
  )
}

export const Route = createFileRoute('/_authenticated/logs/operations')({
  validateSearch: searchSchema,
  component: OperationsLogsPage,
})