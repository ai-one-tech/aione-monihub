import { formatDistanceToNow } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { type ApiRoleResponse } from '../data/api-schema'
import { SystemRolesDataTableRowActions } from './system-roles-data-table-row-actions'

export const systemRolesColumns: ColumnDef<ApiRoleResponse>[] = [
  // 选择复选框列（支持当前页全选/取消全选）
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='全选'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn('sticky md:table-cell start-0 z-10 rounded-tl-[inherit]'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='选择行'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='角色名称' />
    ),
    cell: ({ row }) => {
      return (
        <div className='flex space-x-2'>
          <span className='max-w-[200px] truncate font-medium'>
            {row.getValue('name')}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='描述' />
    ),
    cell: ({ row }) => {
      return (
        <div className='flex space-x-2'>
          <span className='text-muted-foreground max-w-[300px] truncate'>
            {row.getValue('description')}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'permissions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='权限数量' />
    ),
    cell: ({ row }) => {
      const permissions = row.getValue('permissions') as string[]
      return <Badge variant='secondary'>{permissions.length} 个权限</Badge>
    },
    // 支持根据数量区间进行筛选
    filterFn: (row, id, value) => {
      const permissions = row.getValue(id) as string[]
      const count = Array.isArray(permissions) ? permissions.length : 0

      const values = Array.isArray(value) ? value : [value]

      return values.some((v: string) => {
        switch (v) {
          case '0':
            return count === 0
          case '1-5':
            return count >= 1 && count <= 5
          case '6-10':
            return count >= 6 && count <= 10
          case '10+':
            return count >= 10
          default:
            return true
        }
      })
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='创建时间' />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue('created_at') as string
      return (
        <div className='flex w-[100px] items-center'>
          <span className='text-muted-foreground text-sm'>
            {formatDistanceToNow(new Date(createdAt), {
              addSuffix: true,
              locale: zhCN,
            })}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'updated_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='更新时间' />
    ),
    cell: ({ row }) => {
      const updatedAt = row.getValue('updated_at') as string
      return (
        <div className='flex w-[100px] items-center'>
          <span className='text-muted-foreground text-sm'>
            {formatDistanceToNow(new Date(updatedAt), {
              addSuffix: true,
              locale: zhCN,
            })}
          </span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='操作' />
    ),
    cell: ({ row }) => <SystemRolesDataTableRowActions row={row} />,
  },
]
