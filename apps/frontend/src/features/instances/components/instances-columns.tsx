import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type InstanceResponse, INSTANCE_STATUS_LABELS } from '../data/api-schema'
import { InstancesDataTableRowActions } from './instances-data-table-row-actions'

export const instancesColumns: ColumnDef<InstanceResponse>[] = [
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
      <DataTableColumnHeader column={column} title='实例ID' />
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
      <DataTableColumnHeader column={column} title='实例名称' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 font-medium'>{row.getValue('name')}</LongText>
    ),
  },
  {
    accessorKey: 'hostname',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='主机名' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap font-mono text-sm'>{row.getValue('hostname')}</div>
    ),
  },
  {
    accessorKey: 'ip_address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='内网IP' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap font-mono text-sm'>{row.getValue('ip_address')}</div>
    ),
  },
  {
    accessorKey: 'public_ip',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='公网IP' />
    ),
    cell: ({ row }) => {
      const publicIp = row.getValue('public_ip') as string | undefined
      return (
        <div className='w-fit text-nowrap font-mono text-sm text-muted-foreground'>
          {publicIp || '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'mac_address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='MAC地址' />
    ),
    cell: ({ row }) => {
      const macAddress = row.getValue('mac_address') as string | undefined
      return (
        <LongText className='max-w-24 font-mono text-xs text-muted-foreground'>
          {macAddress || '-'}
        </LongText>
      )
    },
  },
  {
    accessorKey: 'os_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='操作系统' />
    ),
    cell: ({ row }) => {
      const osType = row.getValue('os_type') as string | undefined
      return (
        <div className='w-fit text-nowrap text-sm text-muted-foreground'>
          {osType || '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'instance_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='环境类型' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap text-sm text-muted-foreground'>
        {row.getValue('instance_type')}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const statusConfig = {
        active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        disabled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        offline: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      }
      return (
        <div className='w-fit'>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              statusConfig[status as keyof typeof statusConfig]
            }`}
          >
            {INSTANCE_STATUS_LABELS[status as keyof typeof INSTANCE_STATUS_LABELS]}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const status = row.getValue(id) as string
      return value.includes(status)
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'report_count',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='上报次数' />
    ),
    cell: ({ row }) => {
      const reportCount = row.getValue('report_count') as number | undefined
      return (
        <div className='w-fit text-nowrap text-sm text-muted-foreground'>
          {reportCount || 0}
        </div>
      )
    },
  },
  {
    accessorKey: 'last_report_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='末次上报时间' />
    ),
    cell: ({ row }) => {
      const lastReportAt = row.getValue('last_report_at') as string | undefined
      if (!lastReportAt) return <div className='text-sm text-muted-foreground'>-</div>
      return (
        <div className='w-fit text-nowrap text-sm text-muted-foreground'>
          {new Date(lastReportAt).toLocaleDateString('zh-CN')}
        </div>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='创建时间' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap text-sm text-muted-foreground'>
        {new Date(row.getValue('created_at')).toLocaleDateString('zh-CN')}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: InstancesDataTableRowActions,
  },
]
