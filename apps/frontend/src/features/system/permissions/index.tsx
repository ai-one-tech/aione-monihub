import { useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SystemPermissionsDialogs } from './components/system-permissions-dialogs'
import { SystemPermissionsPrimaryButtons } from './components/system-permissions-primary-buttons'
import { SystemPermissionsProvider } from './components/system-permissions-provider'
import { SystemPermissionsTable } from './components/system-permissions-table'
import { usePermissionsQuery } from './hooks/use-permissions-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const route = getRouteApi('/_authenticated/system/permissions')

export function SystemPermissions() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  // 构建API查询参数
  const apiParams = useMemo(() => {
    // permission_type 可能是串行(API直接传入)或数组(来自表格筛选)
    let permission_type_value = (search.permission_type as string | string[]) || undefined
    
    // 如果是数组，仅使用第一个值
    if (Array.isArray(permission_type_value) && permission_type_value.length > 0) {
      permission_type_value = permission_type_value[0]
    } else if (Array.isArray(permission_type_value)) {
      permission_type_value = undefined
    }
    
    return {
      page: search.page || 1,
      limit: search.pageSize || 10,
      search: search.name || undefined,
      permission_type: permission_type_value,
    }
  }, [search.page, search.pageSize, search.name, search.permission_type])

  const { data, isLoading, error, refetch } = usePermissionsQuery(apiParams)

  return (
    <SystemPermissionsProvider>
      <Main fixed className='flex flex-col'>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 flex-shrink-0'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>权限管理</h2>
            <p className='text-muted-foreground'>
              管理系统权限配置和访问控制
            </p>
          </div>
          <SystemPermissionsPrimaryButtons />
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
                加载权限数据失败：{error.message}
                <button 
                  onClick={() => refetch()} 
                  className='ml-2 underline'
                >
                  重试
                </button>
              </AlertDescription>
            </Alert>
          ) : (
            <SystemPermissionsTable 
              data={data?.data || []} 
              totalPages={data?.total_pages || 0}
              search={search} 
              navigate={navigate as any} 
            />
          )}
        </div>
      </Main>

      <SystemPermissionsDialogs />
    </SystemPermissionsProvider>
  )
}