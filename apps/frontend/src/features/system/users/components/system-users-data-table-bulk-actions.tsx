import { type Table } from '@tanstack/react-table'
import { Trash2, UserX, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type ApiUserResponse } from '../data/api-schema'

interface SystemUsersDataTableBulkActionsProps {
  table: Table<ApiUserResponse>
}

export function SystemUsersDataTableBulkActions({
  table,
}: SystemUsersDataTableBulkActionsProps) {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  if (selectedCount === 0) {
    return null
  }

  return (
    <div className='flex items-center space-x-2'>
      <span className='text-muted-foreground text-sm'>
        已选择 {selectedCount} 个用户
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm'>
            批量操作
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem>
            <UserCheck className='mr-2 h-4 w-4' />
            激活用户
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UserX className='mr-2 h-4 w-4' />
            停用用户
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className='text-red-600'>
            <Trash2 className='mr-2 h-4 w-4' />
            批量删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
