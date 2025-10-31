import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ApplicationsDialogs } from './components/applications-dialogs'
import { ApplicationsPrimaryButtons } from './components/applications-primary-buttons'
import { ApplicationsProvider } from './components/applications-provider'
import { ApplicationsTable } from './components/applications-table'
import { ApplicationsEditSheet } from './components/applications-edit-sheet'
import { useApplicationsQuery } from './hooks/use-applications-query'
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
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>应用管理</h2>
            <p className='text-muted-foreground'>
              管理系统中的所有应用信息
            </p>
          </div>
          <ApplicationsPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
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
    </ApplicationsProvider>
  )
}