import { type Row } from '@tanstack/react-table'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type ApiRoleResponse } from '../data/api-schema'
import { useSystemRolesContext } from './system-roles-provider'

interface SystemRolesDataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function SystemRolesDataTableRowActions<TData>({
  row,
}: SystemRolesDataTableRowActionsProps<TData>) {
  const role = row.original as ApiRoleResponse
  const { setEditingRole, setDeleteRoleId } = useSystemRolesContext()

  return (
    <div className='flex items-center space-x-1'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setEditingRole(role)}
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
              onClick={() => setDeleteRoleId(role.id)}
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