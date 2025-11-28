import { type Row } from '@tanstack/react-table'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { type ApiRoleResponse } from '../data/api-schema'
import { useRoleQuery } from '../hooks/use-roles-query'
import { useSystemRolesContext } from './system-roles-provider'

interface SystemRolesDataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function SystemRolesDataTableRowActions<TData>({
  row,
}: SystemRolesDataTableRowActionsProps<TData>) {
  const role = row.original as ApiRoleResponse
  const {
    setIsSheetOpen,
    setSheetMode,
    setSelectedRoleId,
    setIsDeleteDialogOpen,
    setDeleteRoleId,
  } = useSystemRolesContext()
  // 用于触发数据刷新
  const { refetch } = useRoleQuery(role.id)

  const handleEdit = async () => {
    setSelectedRoleId(role.id)
    setSheetMode('edit')
    // 在打开编辑表单前，重新调用API拉取最新数据
    await refetch()
    setIsSheetOpen(true)
  }

  const handleDelete = () => {
    setDeleteRoleId(role.id)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className='flex items-center space-x-1'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' onClick={handleEdit}>
              <Edit className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>编辑角色</p>
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
            <p>删除角色</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
