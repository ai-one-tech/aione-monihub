import { type Row } from '@tanstack/react-table'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type ApiRoleResponse } from '../data/api-schema'
import { useSystemRolesContext } from './system-roles-provider'
import { rolesApi } from '../api/roles-api'
import { toast } from 'sonner'

interface SystemRolesDataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function SystemRolesDataTableRowActions<TData>({
  row,
}: SystemRolesDataTableRowActionsProps<TData>) {
  const role = row.original as ApiRoleResponse
  const { setIsDialogOpen, setDialogMode, setSelectedRoleId, setIsDeleteDialogOpen, setDeleteRoleId } = useSystemRolesContext()

  const handleEdit = () => {
    setSelectedRoleId(role.id)
    setDialogMode('edit')
    setIsDialogOpen(true)
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
            <Button
              variant='ghost'
              size='sm'
              onClick={handleEdit}
            >
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