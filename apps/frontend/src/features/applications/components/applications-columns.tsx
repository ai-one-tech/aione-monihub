import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type ApplicationResponse, APPLICATION_STATUS_LABELS } from '../data/api-schema'
import { ApplicationsDataTableRowActions } from './applications-data-table-row-actions'
import { useApplicationInstances } from '../hooks/use-application-instances'
import { Badge } from '@/components/ui/badge'

interface OnlineInstancesCellProps {
  applicationId: string
}

function OnlineInstancesCell({ applicationId }: OnlineInstancesCellProps) {
  const { data: instancesData, isLoading } = useApplicationInstances(applicationId)
  
  if (isLoading) {
    return <div className='text-xs text-muted-foreground'>加载中...</div>
  }
  
  const onlineInstances = instancesData?.data?.filter(
    instance => instance.online_status === 'online'
  ) || []
  
  return (
    <div className='w-fit'>
      <Badge 
        variant={onlineInstances.length > 0 ? 'default' : 'secondary'}
        className={`text-xs ${
          onlineInstances.length > 0 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }`}
      >
        {onlineInstances.length} 个在线
      </Badge>
    </div>
  )
}

export const applicationsColumns: ColumnDef<ApplicationResponse>[] = [
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
      <DataTableColumnHeader column={column} title='应用ID' />
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
      <DataTableColumnHeader column={column} title='应用名称' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 font-medium'>{row.getValue('name')}</LongText>
    ),
  },
  {
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='应用代码' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap font-mono text-sm'>{row.getValue('code')}</div>
    ),
  },
  {
    accessorKey: 'project_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='所属项目' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-24 font-mono text-xs text-muted-foreground'>
        {row.getValue('project_id')}
      </LongText>
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='应用描述' />
    ),
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      return (
        <LongText className='max-w-[200px] text-muted-foreground'>
          {description || '暂无描述'}
        </LongText>
      )
    },
  },
  {
    accessorKey: 'tech_stacks',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='技术栈' />
    ),
    cell: ({ row }) => {
      const stacks = (row.getValue('tech_stacks') as { name: string; version: string }[]) || []
      if (!stacks.length) return <div className='text-muted-foreground'>—</div>
      return (
        <div className='flex flex-wrap gap-1'>
          {stacks.map((s, i) => (
            <Badge key={i} variant='secondary' className='text-xs'>{`${s.name}${s.version ? `@${s.version}` : ''}`}</Badge>
          ))}
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
      return (
        <div className='w-fit'>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {APPLICATION_STATUS_LABELS[status as keyof typeof APPLICATION_STATUS_LABELS]}
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
    accessorKey: 'online_instances',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='在线实例' />
    ),
    cell: ({ row }) => <OnlineInstancesCell applicationId={row.original.id} />,
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
    accessorKey: 'updated_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='更新时间' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap text-sm text-muted-foreground'>
        {new Date(row.getValue('updated_at')).toLocaleDateString('zh-CN')}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ApplicationsDataTableRowActions,
  },
]
