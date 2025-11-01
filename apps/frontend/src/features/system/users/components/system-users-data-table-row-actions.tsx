import { type Row } from '@tanstack/react-table'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type ApiUserResponse } from '../data/api-schema'
import { useSystemUsersContext } from './system-users-provider'

interface SystemUsersDataTableRowActionsProps {
  row: Row<ApiUserResponse>
}

export function SystemUsersDataTableRowActions({
  row,
}: SystemUsersDataTableRowActionsProps) {
  const { setIsUserSheetOpen, setUserSheetMode, setIsDeleteDialogOpen, setSelectedUserId } = useSystemUsersContext()
  const user = row.original

  const handleEdit = () => {
    setSelectedUserId(user.id)
    setUserSheetMode('edit')
    setIsUserSheetOpen(true)
  }

  const handleDelete = () => {
    setSelectedUserId(user.id)
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
            <p>编辑用户</p>
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
            <p>删除用户</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}