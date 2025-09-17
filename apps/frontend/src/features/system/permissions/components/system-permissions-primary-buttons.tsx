import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SystemPermissionsPrimaryButtons() {
  return (
    <div className='flex items-center space-x-2'>
      <Button
        onClick={() => {
          // TODO: 实现新增权限功能
          console.log('新增权限')
        }}
      >
        <Plus className='mr-2 h-4 w-4' />
        新增权限
      </Button>
    </div>
  )
}