import { type Table } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ApiPermissionResponse } from '../data/api-schema'

interface DataTableBulkActionsProps {
  table: Table<ApiPermissionResponse>
}

export function SystemPermissionsDataTableBulkActions({
  table,
}: DataTableBulkActionsProps) {
  const selectedRows = table.getFilteredSelectedRowModel().rows

  if (selectedRows.length === 0) {
    return null
  }

  return (
    <div className='flex items-center gap-2'>
      <span className='text-muted-foreground text-sm'>
        已选择 {selectedRows.length} 项
      </span>
      <Button
        variant='destructive'
        size='sm'
        onClick={() => {
          // TODO: 实现批量删除功能
          console.log(
            '批量删除权限:',
            selectedRows.map((row) => row.original.id)
          )
        }}
      >
        <Trash2 className='mr-2 h-4 w-4' />
        批量删除
      </Button>
    </div>
  )
}
