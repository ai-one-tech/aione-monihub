import { type Row } from '@tanstack/react-table'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type ApplicationResponse } from '../data/api-schema'
import { useApplicationsProvider } from './applications-provider'

interface ApplicationsDataTableRowActionsProps {
  row: Row<ApplicationResponse>
}

export function ApplicationsDataTableRowActions({
  row,
}: ApplicationsDataTableRowActionsProps) {
  const {
    setIsEditSheetOpen,
    setEditingApplication,
    setIsViewDialogOpen,
    setViewingApplication,
    setIsDeleteDialogOpen,
    setDeletingApplication,
  } = useApplicationsProvider()
  
  const application = row.original

  const handleView = () => {
    setViewingApplication(application)
    setIsViewDialogOpen(true)
  }

  const handleEdit = () => {
    setEditingApplication(application)
    setIsEditSheetOpen(true)
  }

  const handleDelete = () => {
    setDeletingApplication(application)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className='flex items-center space-x-1'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' onClick={handleView}>
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
            <Button variant='ghost' size='sm' onClick={handleEdit}>
              <Edit className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>编辑应用</p>
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
            <p>删除应用</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
