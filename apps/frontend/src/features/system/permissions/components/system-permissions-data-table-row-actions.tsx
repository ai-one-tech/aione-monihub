import { type Row } from '@tanstack/react-table'
import { Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { type ApiPermissionResponse } from '../data/api-schema'
import { useSystemPermissions } from './system-permissions-provider'

interface DataTableRowActionsProps {
  row: Row<ApiPermissionResponse>
}

export function SystemPermissionsDataTableRowActions({
  row,
}: DataTableRowActionsProps) {
  const permission = row.original
  const {
    setIsPermissionSheetOpen,
    setPermissionSheetMode,
    setSelectedPermissionId,
    setIsDeleteDialogOpen,
  } = useSystemPermissions()

  const handleView = () => {
    setPermissionSheetMode('view')
    setSelectedPermissionId(permission.id)
    setIsPermissionSheetOpen(true)
  }

  const handleEdit = () => {
    setPermissionSheetMode('edit')
    setSelectedPermissionId(permission.id)
    setIsPermissionSheetOpen(true)
  }

  const handleDelete = () => {
    setSelectedPermissionId(permission.id)
    setIsDeleteDialogOpen(true)
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
            <p>编辑权限</p>
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
            <p>删除权限</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
