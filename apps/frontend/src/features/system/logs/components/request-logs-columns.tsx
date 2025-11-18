import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type LogItem } from '../data/api-schema'

export const requestLogsColumns: ColumnDef<LogItem>[] = [
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
    accessorKey: 'timestamp',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='时间' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap ps-3 font-mono text-xs'>
        {row.getValue('timestamp') as string}
      </div>
    ),
  },
  {
    accessorKey: 'log_level',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='级别' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap uppercase'>
        {row.getValue('log_level') as string}
      </div>
    ),
  },
  {
    accessorKey: 'action',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='请求' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-64'>{row.getValue('action') as string}</LongText>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'ip_address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='IP' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-24 font-mono text-xs'>{row.getValue('ip_address') as string}</LongText>
    ),
  },
  {
    accessorKey: 'user_agent',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='UA' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>{row.getValue('user_agent') as string}</LongText>
    ),
  },
  {
    accessorKey: 'user_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='用户ID' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-24 font-mono text-xs'>{row.getValue('user_id') as string}</LongText>
    ),
  },
]

