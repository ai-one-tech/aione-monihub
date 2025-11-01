import { type Row } from '@tanstack/react-table'
import { Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type ApiPermissionResponse } from '../data/api-schema'

interface DataTableRowActionsProps {
  row: Row<ApiPermissionResponse>
}

export function SystemPermissionsDataTableRowActions({
  row,
}: DataTableRowActionsProps) {
  const permission = row.original

  return (
    <div className='flex items-center space-x-1'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='sm' onClick={() => {/* TODO: 查看权限详情 */}}>
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
            <Button variant='ghost' size='sm' onClick={() => {/* TODO: 编辑权限 */}}>
              <Edit className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>编辑权限</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {/* TODO: 删除权限 */}}
              className='text-destructive hover:text-destructive'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>删除权限</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}