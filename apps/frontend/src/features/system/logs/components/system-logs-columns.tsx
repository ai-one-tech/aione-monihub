import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type LogItem } from '../data/api-schema'

export const systemLogsColumns: ColumnDef<LogItem>[] = [
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
      <div className='w-fit ps-3 font-mono text-xs text-nowrap'>
        {row.getValue('timestamp') as string}
      </div>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
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
    filterFn: (row, id, value) => {
      const level = (row.getValue(id) as string)?.toLowerCase()
      return Array.isArray(value)
        ? value.some((v) => v.toLowerCase() === level)
        : (value as string)?.toLowerCase() === level
    },
  },
  {
    accessorKey: 'log_source',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='来源' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>
        {(row.getValue('log_source') as string) || '-'}
      </LongText>
    ),
  },
  {
    accessorKey: 'message',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='消息' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-64'>
        {row.getValue('message') as string}
      </LongText>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'user_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='应用ID' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-24 font-mono text-xs'>
        {row.getValue('user_id') as string}
      </LongText>
    ),
  },
]
