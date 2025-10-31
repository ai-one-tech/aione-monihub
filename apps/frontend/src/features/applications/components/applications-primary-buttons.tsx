import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApplicationsProvider } from './applications-provider'

export function ApplicationsPrimaryButtons() {
  const { setIsCreateSheetOpen } = useApplicationsProvider()

  const handleCreateApplication = () => {
    setIsCreateSheetOpen(true)
  }

  return (
    <div className='flex items-center space-x-2'>
      <Button onClick={handleCreateApplication} size='sm'>
        <Plus className='mr-1 h-4 w-4' />
        新增应用
      </Button>
    </div>
  )
}