import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSystemPermissions } from './system-permissions-provider'

export function SystemPermissionsPrimaryButtons() {
  const { setIsPermissionSheetOpen, setPermissionSheetMode, setSelectedPermissionId } = useSystemPermissions()

  const handleCreatePermission = () => {
    setPermissionSheetMode('create')
    setSelectedPermissionId(null)
    setIsPermissionSheetOpen(true)
  }

  return (
    <div className='flex items-center space-x-2'>
      <Button onClick={handleCreatePermission}>
        <Plus className='mr-2 h-4 w-4' />
        新增权限
      </Button>
    </div>
  )
}