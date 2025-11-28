import { useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SystemRolesDialogs } from './components/system-roles-dialogs'
import { SystemRolesPrimaryButtons } from './components/system-roles-primary-buttons'
import { SystemRolesProvider } from './components/system-roles-provider'
import { SystemRolesTable } from './components/system-roles-table'
import { useRolesQuery } from './hooks/use-roles-query'

const route = getRouteApi('/_authenticated/system/roles')

export function SystemRoles() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  // 构建API查询参数
  const apiParams = useMemo(
    () => ({
      page: search.page,
      limit: search.pageSize,
      search: search.search || undefined,
    }),
    [search.page, search.pageSize, search.search]
  )

  const { data, isLoading, error, refetch } = useRolesQuery(apiParams)

  return (
    <SystemRolesProvider>
      <Main fixed className='flex flex-col'>
        <div className='mb-2 flex flex-shrink-0 flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>角色管理</h2>
            <p className='text-muted-foreground'>管理系统角色和权限分配</p>
          </div>
          <SystemRolesPrimaryButtons />
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
                加载角色数据失败：{error.message}
                <button onClick={() => refetch()} className='ml-2 underline'>
                  重试
                </button>
              </AlertDescription>
            </Alert>
          ) : (
            <SystemRolesTable
              data={data?.data || []}
              totalPages={data?.total_pages || 0}
              search={search}
              navigate={navigate}
              onRefresh={refetch}
            />
          )}
        </div>
      </Main>

      <SystemRolesDialogs />
    </SystemRolesProvider>
  )
}
