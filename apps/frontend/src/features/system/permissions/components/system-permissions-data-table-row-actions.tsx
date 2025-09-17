import { type Row } from '@tanstack/react-table'
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type ApiPermissionResponse } from '../data/api-schema'

interface DataTableRowActionsProps {
  row: Row<ApiPermissionResponse>
}

export function SystemPermissionsDataTableRowActions({
  row,
}: DataTableRowActionsProps) {
  const permission = row.original

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
        <DropdownMenuItem>
          <Eye className='mr-2 h-4 w-4' />
          查看详情
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Edit className='mr-2 h-4 w-4' />
          编辑权限
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='text-destructive'>
          <Trash2 className='mr-2 h-4 w-4' />
          删除权限
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}