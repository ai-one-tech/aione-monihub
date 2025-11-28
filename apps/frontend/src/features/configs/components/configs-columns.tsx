import { ColumnDef } from '@tanstack/react-table'
import { formatDateTime } from '@/lib/datetime'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import type { ConfigResponse } from '../api/configs-api'
import { ConfigsDataTableRowActions } from './configs-data-table-row-actions'

export const columns: ColumnDef<ConfigResponse>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='代码' />
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='名称' />
    ),
  },
  {
    accessorKey: 'environment',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='环境' />
    ),
    cell: ({ row }) => (
      <Badge variant='outline'>{row.original.environment}</Badge>
    ),
  },
  {
    accessorKey: 'config_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='类型' />
    ),
    cell: ({ row }) => <Badge>{row.original.config_type}</Badge>,
  },
  {
    accessorKey: 'version',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='版本' />
    ),
  },
  {
    accessorKey: 'updated_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='更新时间' />
    ),
    cell: ({ row }) => formatDateTime(row.original.updated_at),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='描述' />
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <ConfigsDataTableRowActions row={row} />,
  },
]
