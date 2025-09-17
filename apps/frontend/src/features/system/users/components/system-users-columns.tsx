import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type ApiUserResponse } from '../data/api-schema'
import { SystemUsersDataTableRowActions } from './system-users-data-table-row-actions'

export const systemUsersColumns: ColumnDef<ApiUserResponse>[] = [
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
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='用户ID' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-24 ps-3 font-mono text-xs'>{row.getValue('id')}</LongText>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='用户名' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>{row.getValue('username')}</LongText>
    ),
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='邮箱' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>{row.getValue('email')}</div>
    ),
  },
  {
    accessorKey: 'roles',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='角色' />
    ),
    cell: ({ row }) => {
      const roles = row.getValue('roles') as string[] | undefined
      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return <span className='text-muted-foreground text-xs'>暂无角色</span>
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {roles.map((role, index) => (
            <Badge key={index} variant='outline' className='text-xs'>
              {role}
            </Badge>
          ))}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const roles = row.getValue(id) as string[] | undefined
      if (!roles || !Array.isArray(roles)) return false
      return value.some((v: string) => roles.includes(v))
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    cell: SystemUsersDataTableRowActions,
  },
]