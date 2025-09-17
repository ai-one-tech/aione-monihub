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
import { type ApiUserResponse } from '../data/api-schema'
import { useSystemUsersContext } from './system-users-provider'

interface SystemUsersDataTableRowActionsProps {
  row: Row<ApiUserResponse>
}

export function SystemUsersDataTableRowActions({
  row,
}: SystemUsersDataTableRowActionsProps) {
  const { setIsEditDialogOpen, setIsDeleteDialogOpen, setSelectedUserId } = useSystemUsersContext()
  const user = row.original

  const handleEdit = () => {
    setSelectedUserId(user.id)
    setIsEditDialogOpen(true)
  }

  const handleDelete = () => {
    setSelectedUserId(user.id)
    setIsDeleteDialogOpen(true)
  }

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
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className='mr-2 h-4 w-4' />
          编辑
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className='text-red-600'>
          <Trash2 className='mr-2 h-4 w-4' />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}