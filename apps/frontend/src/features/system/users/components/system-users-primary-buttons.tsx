import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSystemUsersContext } from './system-users-provider'

export function SystemUsersPrimaryButtons() {
  const { setIsUserSheetOpen, setUserSheetMode, setSelectedUserId } =
    useSystemUsersContext()

  const handleCreateUser = () => {
    setUserSheetMode('create')
    setSelectedUserId(null)
    setIsUserSheetOpen(true)
  }

  return (
    <div className='flex items-center space-x-2'>
      <Button onClick={handleCreateUser}>
        <Plus className='mr-1 h-4 w-4' />
        新增用户
      </Button>
    </div>
  )
}
