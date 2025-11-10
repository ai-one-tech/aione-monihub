import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type ApiPermissionResponse } from '../data/api-schema'
import { ACTION_MAP, PERMISSION_TYPE_MAP } from '../data/permission-enums'
import { SystemPermissionsDataTableRowActions } from './system-permissions-data-table-row-actions'

export const systemPermissionsColumns: ColumnDef<ApiPermissionResponse>[] = [
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
      <DataTableColumnHeader column={column} title='权限ID' />
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='权限名称' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 font-medium'>{row.getValue('name')}</LongText>
    ),
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='描述' />
    ),
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null
      return (
        <LongText className='max-w-48 text-muted-foreground'>
          {description || '暂无描述'}
        </LongText>
      )
    },
    meta: { className: 'w-48' },
  },
  {
    accessorKey: 'permission_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='类型' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('permission_type') as string
      const typeInfo = PERMISSION_TYPE_MAP[type] || { label: type, variant: 'outline' as const }
      return (
        <Badge variant={typeInfo.variant} className='text-xs'>
          {typeInfo.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const permissionType = row.getValue(id) as string
      return value.includes(permissionType)
    },
  },
  {
    accessorKey: 'action',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='操作' />
    ),
    cell: ({ row }) => {
      const action = row.getValue('action') as string | null
      if (!action) {
        return (
          <Badge variant="secondary" className='text-xs'>
            --
          </Badge>
        )
      }
      // 兼容大小写（后端为 snake_case）
      const key = action.toLowerCase()
      const actionInfo = ACTION_MAP[key] || { label: action, variant: 'outline' as const }
      return (
        <Badge variant={actionInfo.variant} className='text-xs'>
          {actionInfo.label}
        </Badge>
      )
    },
  },

  {
    accessorKey: 'sort_order',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='排序' />
    ),
    cell: ({ row }) => {
      const sortOrder = row.getValue('sort_order') as number | null
      return (
        <div className='text-center text-sm text-muted-foreground'>
          {sortOrder ?? '-'}
        </div>
      )
    },
    meta: { className: 'w-20' },
  },
  {
    id: 'actions',
    cell: SystemPermissionsDataTableRowActions,
  },
]