import { type Row } from '@tanstack/react-table'
import { Eye, Trash2, Power, PowerOff, FileText, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { type InstanceResponse } from '../data/api-schema'
import { useInstancesProvider } from './instances-provider'

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
    setIsEnableDisableDialogOpen,
    setEnableDisableInstanceId,
    setEnableDisableAction,
    setReportDrawerOpen,
    setReportInstance,
    setConfigDrawerOpen,
  } = useInstancesProvider()

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
      setEnableDisableInstanceId(instance.id)
      setEnableDisableAction('enable')
      setIsEnableDisableDialogOpen(true)
    }
  }

  const handleDisable = () => {
    if (instance.status === 'active') {
      setEnableDisableInstanceId(instance.id)
      setEnableDisableAction('disable')
      setIsEnableDisableDialogOpen(true)
    }
  }

  const handleViewReports = () => {
    setReportInstance(instance)
    setReportDrawerOpen(true)
  }

  const handleConfig = () => {
    setSelectedInstanceId(instance.id)
    setConfigDrawerOpen(true)
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

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' onClick={handleConfig}>
              <Settings className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>配置</p>
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
              <Button variant='ghost' size='sm' onClick={handleDisable}>
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
              <Button variant='ghost' size='sm' onClick={handleEnable}>
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
