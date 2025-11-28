import { type ColumnDef } from '@tanstack/react-table'
import { formatDateTime } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import {
  type InstanceResponse,
  INSTANCE_STATUS_LABELS,
} from '../data/api-schema'
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
      className: cn(
        'sticky md:table-cell start-0 z-10 bg-background rounded-tl-[inherit]'
      ),
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
      <LongText className='max-w-24 ps-3 font-mono text-xs'>
        {row.getValue('id')}
      </LongText>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'sticky start-6 z-10 bg-background @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'hostname',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='主机名' />
    ),
    cell: ({ row }) => (
      <LongText className='w-fit font-mono text-sm text-nowrap'>
        {row.getValue('hostname')}
      </LongText>
    ),
  },
  {
    accessorKey: 'ip_address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='内网IP' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-24 font-mono text-sm'>
        {row.getValue('ip_address')}
      </LongText>
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
        <LongText className='text-muted-foreground max-w-24 font-mono text-sm text-nowrap'>
          {publicIp || '-'}
        </LongText>
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
        <LongText className='text-muted-foreground max-w-24 font-mono text-xs'>
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
        <div className='text-muted-foreground w-fit text-sm text-nowrap'>
          {osType || '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const statusConfig = {
        active:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        disabled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        offline:
          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      }
      return (
        <div className='w-fit'>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              statusConfig[status as keyof typeof statusConfig]
            }`}
          >
            {
              INSTANCE_STATUS_LABELS[
                status as keyof typeof INSTANCE_STATUS_LABELS
              ]
            }
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
    accessorKey: 'online_status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='在线状态' />
    ),
    cell: ({ row }) => {
      const onlineStatus = row.getValue('online_status') as string
      const statusConfig = {
        online:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        offline:
          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      }
      const statusLabels = {
        online: '在线',
        offline: '离线',
      }
      return (
        <div className='w-fit'>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              statusConfig[onlineStatus as keyof typeof statusConfig]
            }`}
          >
            {statusLabels[onlineStatus as keyof typeof statusLabels]}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const onlineStatus = row.getValue(id) as string
      return value.includes(onlineStatus)
    },
  },
  {
    accessorKey: 'report_count',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='上报次数' />
    ),
    cell: ({ row }) => {
      const reportCount = row.getValue('report_count') as number | undefined
      return (
        <div className='text-muted-foreground w-fit text-sm text-nowrap'>
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
      if (!lastReportAt)
        return <div className='text-muted-foreground text-sm'>-</div>
      return (
        <div className='text-muted-foreground w-fit text-sm text-nowrap'>
          {formatDateTime(lastReportAt)}
        </div>
      )
    },
  },
  // {
  //   accessorKey: 'first_report_at',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title='首次上报时间' />
  //   ),
  //   cell: ({ row }) => {
  //     const firstReportAt = row.getValue('first_report_at') as string | undefined
  //     if (!firstReportAt) return <div className='text-sm text-muted-foreground'>-</div>
  //     return (
  //       <div className='w-fit text-nowrap text-sm text-muted-foreground'>
  //         {new Date(firstReportAt).toLocaleString('zh-CN', { hour12: false })}
  //       </div>
  //     )
  //   },
  // },
  // {
  //   accessorKey: 'offline_at',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title='离线时间' />
  //   ),
  //   cell: ({ row }) => {
  //     const offlineAt = row.getValue('offline_at') as string | undefined
  //     if (!offlineAt) return <div className='text-sm text-muted-foreground'>-</div>
  //     return (
  //       <div className='w-fit text-nowrap text-sm text-muted-foreground'>
  //         {new Date(offlineAt).toLocaleString('zh-CN', { hour12: false })}
  //       </div>
  //     )
  //   },
  // },
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='操作' />
    ),
    cell: InstancesDataTableRowActions,
    meta: {
      className: cn(
        'sticky end-0 z-20 bg-background rounded-tr-[inherit] min-w-[140px]'
      ),
    },
    enableHiding: false,
  },
]
