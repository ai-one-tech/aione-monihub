import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { SystemRolesDataTableRowActions } from './system-roles-data-table-row-actions'
import { type ApiRoleResponse } from '../data/api-schema'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export const systemRolesColumns: ColumnDef<ApiRoleResponse>[] = [
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
          <span className='max-w-[300px] truncate text-muted-foreground'>
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
      return (
        <Badge variant='secondary'>
          {permissions.length} 个权限
        </Badge>
      )
    },
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
          <span className='text-sm text-muted-foreground'>
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
          <span className='text-sm text-muted-foreground'>
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
    cell: ({ row }) => <SystemRolesDataTableRowActions row={row} />,
  },
]