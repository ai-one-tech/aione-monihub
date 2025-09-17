import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSystemRolesContext } from './system-roles-provider'

export function SystemRolesPrimaryButtons() {
  const { setIsCreateDialogOpen } = useSystemRolesContext()

  return (
    <div className='flex items-center space-x-2'>
      <Button
        onClick={() => setIsCreateDialogOpen(true)}
        size='sm'
        className='h-8'
      >
        <Plus className='mr-2 h-4 w-4' />
        新建角色
      </Button>
    </div>
  )
}