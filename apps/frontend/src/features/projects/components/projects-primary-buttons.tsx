import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectsContext } from './projects-provider'

export function ProjectsPrimaryButtons() {
  const { openCreateProject } = useProjectsContext()

  return (
    <div className='flex items-center space-x-2'>
      <Button onClick={openCreateProject} size='sm'>
        <Plus className='mr-1 h-4 w-4' />
        新增项目
      </Button>
    </div>
  )
}