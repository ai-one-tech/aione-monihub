import { type Row } from '@tanstack/react-table'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type ProjectResponse } from '../data/api-schema'
import { useProjectsContext } from './projects-provider'

interface ProjectsDataTableRowActionsProps {
  row: Row<ProjectResponse>
}

export function ProjectsDataTableRowActions({
  row,
}: ProjectsDataTableRowActionsProps) {
  const { openEditProject, openProjectDetail, openDeleteDialog } = useProjectsContext()
  const project = row.original

  return (
    <div className='flex items-center space-x-1'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' onClick={() => openProjectDetail(project)}>
              <Eye className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>查看详情</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' onClick={() => openEditProject(project)}>
              <Edit className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>编辑项目</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => openDeleteDialog(project)}
              className='text-destructive hover:text-destructive'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>删除项目</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
