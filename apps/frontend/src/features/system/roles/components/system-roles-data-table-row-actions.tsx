import { type Row } from '@tanstack/react-table'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <MoreHorizontal className='h-4 w-4' />
          <span className='sr-only'>打开菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuItem
          onClick={() => setEditingRole(role)}
        >
          <Edit className='mr-2 h-4 w-4' />
          编辑
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setDeleteRoleId(role.id)}
          className='text-destructive focus:text-destructive'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}