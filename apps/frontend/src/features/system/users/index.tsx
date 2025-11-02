import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SystemUsersDialogs } from './components/system-users-dialogs'
import { SystemUsersPrimaryButtons } from './components/system-users-primary-buttons'
import { SystemUsersProvider } from './components/system-users-provider'
import { SystemUsersTable } from './components/system-users-table'
import { useUsersQuery } from './hooks/use-users-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const route = getRouteApi('/_authenticated/system/users')

export function SystemUsers() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  // 构建API查询参数
  const apiParams = {
    page: search.page || 1,
    limit: search.pageSize || 10,
    search: search.username || undefined,
  }

  const { data, isLoading, error, refetch } = useUsersQuery(apiParams)

  return (
    <SystemUsersProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='flex flex-col'>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 flex-shrink-0'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>系统用户管理</h2>
            <p className='text-muted-foreground'>
              管理系统用户账户和权限设置
            </p>
          </div>
          <SystemUsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 min-h-0 overflow-hidden px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
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
                加载用户数据失败：{error.message}
                <button 
                  onClick={() => refetch()} 
                  className='ml-2 underline'
                >
                  重试
                </button>
              </AlertDescription>
            </Alert>
          ) : (
            <SystemUsersTable 
              data={data?.data || []} 
              search={search} 
              navigate={navigate} 
            />
          )}
        </div>
      </Main>

      <SystemUsersDialogs />
    </SystemUsersProvider>
  )
}