import { type Row } from '@tanstack/react-table'
import { Eye, Trash2, Power, PowerOff, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type InstanceResponse } from '../data/api-schema'
import { useInstancesProvider } from './instances-provider'
import { useEnableInstance, useDisableInstance } from '../hooks/use-instances-query'

interface InstancesDataTableRowActionsProps {
  row: Row<InstanceResponse>
}

export function InstancesDataTableRowActions({
  row,
}: InstancesDataTableRowActionsProps) {
  const {
    setIsSheetOpen,
    setSheetMode,
    setSelectedInstanceId,
    setIsDeleteDialogOpen,
    setDeletingInstanceId,
    setReportDrawerOpen,
    setReportInstance,
  } = useInstancesProvider()
  
  const enableInstance = useEnableInstance()
  const disableInstance = useDisableInstance()
  
  const instance = row.original

  const handleView = () => {
    setSelectedInstanceId(instance.id)
    setSheetMode('view')
    setIsSheetOpen(true)
  }

  // 移除编辑功能
  /*
  const handleEdit = () => {
    setSelectedInstanceId(instance.id)
    setSheetMode('edit')
    setIsSheetOpen(true)
  }
  */

  const handleDelete = () => {
    setDeletingInstanceId(instance.id)
    setIsDeleteDialogOpen(true)
  }

  const handleEnable = () => {
    if (instance.status !== 'active') {
      enableInstance.mutate(instance.id)
    }
  }

  const handleDisable = () => {
    if (instance.status === 'active') {
      disableInstance.mutate(instance.id)
    }
  }

  const handleViewReports = () => {
    setReportInstance(instance)
    setReportDrawerOpen(true)
  }

  const isActive = instance.status === 'active'

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
            <Button variant='ghost' size='sm' onClick={handleViewReports}>
              <FileText className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>查看上报记录</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 移除编辑按钮 */}
      {/* 
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' onClick={handleEdit}>
              <Edit className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>编辑实例</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      */}

      {isActive ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleDisable}
                disabled={disableInstance.isPending}
              >
                <PowerOff className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>禁用实例</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleEnable}
                disabled={enableInstance.isPending}
              >
                <Power className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>启用实例</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

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
            <p>删除实例</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}