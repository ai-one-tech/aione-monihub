import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { SystemLogsTable } from './components/system-logs-table'
import { useLogsQuery } from './hooks/use-logs-query'
import { DatePicker } from '@/components/date-picker'
import { useMemo, useState } from 'react'
import { requestLogsColumns } from './components/request-logs-columns'

const route = getRouteApi('/_authenticated/logs/requests')

export function RequestLogs() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    return search.startDate ? new Date(search.startDate as string) : undefined
  })
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    return search.endDate ? new Date(search.endDate as string) : undefined
  })

  const apiParams = useMemo(() => {
    return {
      page: (search.page as number) || 1,
      limit: (search.pageSize as number) || 10,
      log_level: (search.level as string) || undefined,
      keyword: (search.keyword as string) || undefined,
      start_date: startDate ? startDate.toISOString() : ((search.startDate as string) || undefined),
      end_date: endDate ? endDate.toISOString() : ((search.endDate as string) || undefined),
      source: 'http',
    }
  }, [search, startDate, endDate])

  const { data, isLoading, error, refetch } = useLogsQuery(apiParams)

  const totalPages = useMemo(() => {
    const total = data?.pagination?.total ?? 0
    const pageSize = (search.pageSize as number) || 10
    return Math.max(1, Math.ceil(total / pageSize))
  }, [data?.pagination?.total, search.pageSize])

  return (
    <Main fixed className='flex flex-col'>
      <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 flex-shrink-0'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>请求日志</h2>
          <p className='text-muted-foreground'>查看后端接口的请求与响应元信息</p>
        </div>
      </div>

      <div className='flex gap-3 items-center mb-2'>
        <DatePicker
          selected={startDate}
          onSelect={(d) => {
            setStartDate(d)
            navigate({
              search: (prev) => ({
                ...(prev as any),
                startDate: d ? d.toISOString() : undefined,
                page: undefined,
              }),
            })
          }}
          placeholder='开始日期'
        />
        <DatePicker
          selected={endDate}
          onSelect={(d) => {
            setEndDate(d)
            navigate({
              search: (prev) => ({
                ...(prev as any),
                endDate: d ? d.toISOString() : undefined,
                page: undefined,
              }),
            })
          }}
          placeholder='结束日期'
        />
      </div>

      <div className='flex-1 min-h-0 overflow-hidden py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
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
              <button onClick={() => refetch()} className='ml-2 underline'>重试</button>
            </AlertDescription>
          </Alert>
        ) : (
          <SystemLogsTable
            data={data?.data || []}
            totalPages={totalPages}
            search={search as any}
            navigate={navigate as any}
            columns={requestLogsColumns}
          />
        )}
      </div>
    </Main>
  )
}

