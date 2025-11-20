import { useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useConfigsQuery } from './hooks/use-configs-query'
import { ConfigsTable } from './components/configs-table'
import { ConfigsProvider } from './components/configs-provider'
import { ConfigsPrimaryButtons } from './components/configs-primary-buttons'
import { ConfigsEditSheet } from './components/configs-edit-sheet'
import { ConfigsDialogs } from './components/configs-dialogs'

export function Configs() {
  const route = getRouteApi('/_authenticated/configs')
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isLoading, isError } = useConfigsQuery()
  const tableData = useMemo(() => data?.data ?? [], [data])

  return (
    <ConfigsProvider>
      <Main fixed className='flex flex-col'>
        <div className="flex items-center justify-between gap-4">
          <ConfigsPrimaryButtons />
        </div>
        <div className='flex-1 min-h-0'>
          {isLoading ? (
            <div className="mt-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[480px] w-full" />
            </div>
          ) : isError ? (
            <Alert className="mt-6" variant="destructive">
              <AlertTitle>加载失败</AlertTitle>
              <AlertDescription>获取配置列表失败</AlertDescription>
            </Alert>
          ) : (
            <ConfigsTable data={tableData} search={search as Record<string, unknown>} navigate={navigate} />
          )}
        </div>
        <ConfigsEditSheet />
        <ConfigsDialogs />
      </Main>
    </ConfigsProvider>
  )
}

export default Configs