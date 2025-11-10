import { type Row } from '@tanstack/react-table'
import { Eye, Edit, Trash2, Link2, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type ApplicationResponse } from '../data/api-schema'
import { useApplicationsProvider } from './applications-provider'
import { getRouteApi } from '@tanstack/react-router'

interface ApplicationsDataTableRowActionsProps {
  row: Row<ApplicationResponse>
}

export function ApplicationsDataTableRowActions({
  row,
}: ApplicationsDataTableRowActionsProps) {
  const applicationTasksRoute = getRouteApi('/_authenticated/application-tasks')
  const navigate = applicationTasksRoute.useNavigate()
  const {
    setIsSheetOpen,
    setSheetMode,
    setSelectedApplicationId,
    setIsDeleteDialogOpen,
    setDeletingApplicationId,
  } = useApplicationsProvider()

  const application = row.original

  const handleView = () => {
    setSelectedApplicationId(application.id)
    setSheetMode('view')
    setIsSheetOpen(true)
  }

  const handleEdit = () => {
    setSelectedApplicationId(application.id)
    setSheetMode('edit')
    setIsSheetOpen(true)
  }

  const handleDelete = () => {
    setDeletingApplicationId(application.id)
    setIsDeleteDialogOpen(true)
  }

  const handleConnectInstances = () => {
    navigate({
      to: '/application-tasks',
      search: {
        applicationId: application.id,
      },
    })
  }

  const handleViewInstances = () => {
    navigate({
      to: '/instances',
      search: {
        application_id: application.id,
      },
    })
  }

  return (
    <div className='flex items-center space-x-1'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' onClick={handleView}>
              <Eye className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>查看详情</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' onClick={handleEdit}>
              <Edit className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>编辑应用</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' onClick={handleConnectInstances}>
              <Link2 className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>连接实例</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' onClick={handleViewInstances}>
              <Server className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>查看实例</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleDelete}
              className='text-destructive hover:text-destructive'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>删除应用</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
