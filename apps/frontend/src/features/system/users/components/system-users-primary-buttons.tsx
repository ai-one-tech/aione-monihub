import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSystemUsersContext } from './system-users-provider'

export function SystemUsersPrimaryButtons() {
  const { setIsCreateDialogOpen } = useSystemUsersContext()

  return (
    <div className='flex items-center space-x-2'>
      <Button onClick={() => setIsCreateDialogOpen(true)}>
        <Plus className='mr-2 h-4 w-4' />
        新增用户
      </Button>
    </div>
  )
}