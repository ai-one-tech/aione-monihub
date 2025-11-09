import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ApplicationsDialogs } from './components/applications-dialogs'
import { ApplicationsPrimaryButtons } from './components/applications-primary-buttons'
import { ApplicationsProvider, useApplicationsProvider } from './components/applications-provider'
import { ApplicationsTable } from './components/applications-table'
import { ApplicationsEditSheet } from './components/applications-edit-sheet'
import { ApplicationTaskDrawer } from './components/applications-task-drawer'
import { useApplicationsQuery } from './hooks/use-applications-query'
import { useApplicationById } from './hooks/use-applications-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const route = getRouteApi('/_authenticated/applications')

export function Applications() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  // 构建API查询参数
  const apiParams = {
    page: search.page || 1,
    limit: search.pageSize || 10,
    search: search.search || undefined,
    status: (search.status && search.status !== 'all') ? search.status as 'active' | 'inactive' | 'archived' : undefined,
    project_id: search.project_id || undefined,
  }

  const { data, isLoading, error, refetch } = useApplicationsQuery(apiParams)

  return (
    <ApplicationsProvider>
      <Main fixed className='flex flex-col'>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 flex-shrink-0'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>应用管理</h2>
            <p className='text-muted-foreground'>
              管理系统中的所有应用信息
            </p>
          </div>
          <ApplicationsPrimaryButtons />
        </div>
        <div className='flex-1 min-h-0 overflow-hidden px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
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
                加载应用数据失败：{error.message}
                <button 
                  onClick={() => refetch()} 
                  className='ml-2 underline'
                >
                  重试
                </button>
              </AlertDescription>
            </Alert>
          ) : (
            <ApplicationsTable 
              data={data?.data || []} 
              search={search} 
              navigate={navigate} 
            />
          )}
        </div>
      </Main>

      <ApplicationsEditSheet />
      <ApplicationsDialogs />
      <TaskDrawerWrapper />
    </ApplicationsProvider>
  )
}

function TaskDrawerWrapper() {
  const { isTaskDrawerOpen, setIsTaskDrawerOpen, taskDrawerApplicationId } = useApplicationsProvider()
  const { data: application } = useApplicationById(taskDrawerApplicationId || '')

  if (!taskDrawerApplicationId || !application) return null

  return (
    <ApplicationTaskDrawer
      application={application}
      open={isTaskDrawerOpen}
      onOpenChange={setIsTaskDrawerOpen}
    />
  )
}