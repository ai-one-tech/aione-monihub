import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { InstancesProvider } from './components/instances-provider'
import { InstancesTable } from './components/instances-data-table'
import { InstancesEditSheet } from './components/instances-edit-sheet'
import { InstancesDeleteDialog } from './components/instances-delete-dialog'
import { InstanceReportDrawer } from './components/instances-report-drawer'
import { useInstancesQuery } from './hooks/use-instances-query'
import { useInstancesProvider } from './components/instances-provider'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const route = getRouteApi('/_authenticated/instances')

function InstancesContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { 
    setIsSheetOpen, 
    setSheetMode, 
    setSelectedInstanceId,
    reportDrawerOpen,
    setReportDrawerOpen,
    reportInstance,
  } = useInstancesProvider()

  // 构建API查询参数
  const apiParams = {
    page: search.page || 1,
    limit: search.pageSize || 10,
    search: search.search || undefined,
    status: (search.status) ? search.status as 'active' | 'disabled' | 'offline' : undefined,
    online_status: (search.online_status) ? search.online_status as 'online' | 'offline' : undefined,
    application_id: search.application_id || undefined,
    ip_address: search.ip_address || undefined,
    public_ip: search.public_ip || undefined,
    hostname: search.hostname || undefined,
    os_type: (search.os_type) ? search.os_type : undefined,
  }

  const { data, isLoading, error, refetch } = useInstancesQuery(apiParams)

  // 移除创建实例功能
  /*
  const handleCreateInstance = () => {
    setSelectedInstanceId(null)
    setSheetMode('create')
    setIsSheetOpen(true)
  }
  */

  return (
    <>
      <Main fixed className='flex flex-col'>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 flex-shrink-0'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>实例管理</h2>
            <p className='text-muted-foreground'>
              管理系统中的所有实例信息
            </p>
          </div>
          {/* 移除创建实例按钮 */}
          {/* <Button onClick={handleCreateInstance} size='sm'>
            <Plus className='h-4 w-4 mr-2' />
            新增实例
          </Button> */}
        </div>
        <div className='flex-1 min-h-0 min-w-0 overflow-hidden py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
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
                加载实例数据失败：{error.message}
                <button 
                  onClick={() => refetch()} 
                  className='ml-2 underline'
                >
                  重试
                </button>
              </AlertDescription>
            </Alert>
          ) : (
            <InstancesTable 
              data={data?.data || []}
              totalPages={Math.ceil((data?.pagination.total || 0) / (data?.pagination.limit || 10))}
              search={search} 
              navigate={navigate} 
            />
          )}
        </div>
      </Main>

      <InstancesEditSheet />
      <InstancesDeleteDialog />
      <InstanceReportDrawer 
        instance={reportInstance}
        open={reportDrawerOpen}
        onOpenChange={setReportDrawerOpen}
      />
    </>
  )
}

export function Instances() {
  return (
    <InstancesProvider>
      <InstancesContent />
    </InstancesProvider>
  )
}