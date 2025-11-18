import { useEffect, useMemo, useState } from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useApplicationsQuery } from '@/features/applications/hooks/use-applications-query'
import { useInstancesQuery } from '@/features/instances/hooks/use-instances-query'
import { CheckCircle2, CircleOff } from 'lucide-react'

const OnlineIcon: React.FC<{ className?: string }> = () => (
  <CheckCircle2 className='size-4 text-green-500' />
)
const OfflineIcon: React.FC<{ className?: string }> = ({ className }) => (
  <CircleOff className={className} />
)
import { type LogResponse } from '../data/api-schema'
import { OverflowPreview } from '@/components/overflow-preview'
import { parse } from 'date-fns'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> { className: string }
}

type DataTableProps = {
  data: LogResponse[]
  totalPages: number
  search: Record<string, unknown>
  navigate: NavigateFn
  exportUrl: string
  onRefresh?: () => void
}

export function SystemLogsTable({ data = [], totalPages, search, navigate, exportUrl, onRefresh }: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const formatLocalTimestamp = (ts: string) => {
    try {
      const d = parse(ts, 'yyyy-MM-dd HH:mm:ss.SSS xxx', new Date())
      if (!isNaN(d.getTime())) return d.toLocaleString()
    } catch {}
    const d2 = new Date(ts)
    return isNaN(d2.getTime()) ? ts : d2.toLocaleString()
  }

  const { data: appsData } = useApplicationsQuery({ page: 1, limit: 50 })
  const applicationNameMap = useMemo(() => {
    const list = appsData?.data ?? []
    return new Map(list.map((a: any) => [a.id, a.name ?? a.id]))
  }, [appsData])

  const columns: ColumnDef<LogResponse, any>[] = useMemo(() => [
    { accessorKey: 'timestamp', header: '时间', meta: { className: 'w-[180px]' }, cell: ({ row }) => formatLocalTimestamp(row.original.timestamp) },
    { accessorKey: 'log_level', header: '级别', meta: { className: 'w-[100px]' } },
    { accessorKey: 'action', header: '内容', meta: { className: 'w-[150px]' }, cell: ({ row }) => <OverflowPreview value={row.original.action} title='内容' /> },
    { accessorKey: 'application_name', header: '应用', meta: { className: 'w-[160px]' }, cell: ({ row }) => applicationNameMap.get(row.original.user_id) ?? '-' },
    { accessorKey: 'user_id', header: '应用ID', meta: { className: 'w-[140px]' } },
    { accessorKey: 'instance_hostname', header: '实例主机名', meta: { className: 'w-[180px]' }, cell: () => '-' },
    { accessorKey: 'ip_address', header: 'IP', meta: { className: 'w-[150px]' }, cell: ({ row }) => <OverflowPreview value={row.original.ip_address} title='IP' /> },
    { accessorKey: 'user_agent', header: 'UA', meta: { className: 'w-[150px]' }, cell: ({row}) => <OverflowPreview value={row.original.user_agent || '-'} title='UA' /> },
    { accessorKey: 'log_type', header: '类型', meta: { className: 'w-[100px]' }, cell: () => 'system' },
    { accessorKey: 'log_source', header: '来源', meta: { className: 'w-[160px]' } },
  ], [applicationNameMap])

  const { columnFilters, onColumnFiltersChange, pagination, onPaginationChange, ensurePageInRange } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'keyword' },
    columnFilters: [
      { columnId: 'log_level', searchKey: 'log_level', type: 'string' },
      { columnId: 'log_source', searchKey: 'source', type: 'string' },
      { columnId: 'user_id', searchKey: 'user_id', type: 'string' },
      { columnId: 'id', searchKey: 'instance_id', type: 'string' },
    ],
  })

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination, columnVisibility, rowSelection, columnFilters },
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: { onRefresh },
  })

  const sourceFilter = table.getColumn('log_source')?.getFilterValue() as string | undefined
  const appFilter = table.getColumn('user_id')?.getFilterValue() as string | undefined
  const { data: instancesData } = useInstancesQuery({ page: 1, limit: 100, application_id: appFilter || undefined })
  const applicationOptions = useMemo(() => {
    const list = appsData?.data ?? []
    return list.map((a: any) => ({ label: a.name ?? a.id, value: a.id }))
  }, [appsData])
  const instanceOptions = useMemo(() => {
    let list = instancesData?.data ?? []
    // 在线优先排序
    list = [...list].sort((a: any, b: any) => {
      const ao = a.online_status === 'online' ? 1 : 0
      const bo = b.online_status === 'online' ? 1 : 0
      if (ao !== bo) return bo - ao
      return (a.hostname || '').localeCompare(b.hostname || '')
    })
    return list.map((i: any, index: number) => {
      const name = i.hostname || i.id
      const ips = `${(i.ip_address || '').split(',')[0]}${i.public_ip ? ` / ${(i.public_ip || '').split(',')[0]}` : ''}`
      return {
        label: `<span><span style="color: #666">${index}</span> <span style="color: #000; font-weight: 500;">${name}</span> <br /> ${ips}</span>`,
        icon: i.online_status === 'online' ? OnlineIcon : OfflineIcon,
        value: i.id,
      }
    })
  }, [instancesData])

  useEffect(() => { ensurePageInRange(totalPages) }, [totalPages, ensurePageInRange])

  return (
    <div className='flex flex-col h-full min-h-0 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='搜索日志内容...'
        filters={[
          { columnId: 'log_level', title: '日志级别', options: [
            { label: 'DEBUG', value: 'debug' },
            { label: 'INFO', value: 'info' },
            { label: 'WARN', value: 'warn' },
            { label: 'ERROR', value: 'error' },
          ], multiSelect: false },
          { columnId: 'log_source', title: '来源', options: [
            { label: '服务端', value: 'server' },
            { label: '代理端', value: 'agent' },
          ], multiSelect: false },
          ...(sourceFilter === 'agent' ? [
            { columnId: 'user_id', title: '应用', options: applicationOptions, multiSelect: false, contentClassName: 'w-[300px]' },
            { columnId: 'id', title: '实例', options: instanceOptions, multiSelect: false, contentClassName: 'w-[300px]' },
          ] : []),
        ]}
      />
      <div className='flex-1 min-h-0 overflow-auto rounded-md border mt-4'>
        <Table className='w-full min-w-max h-full'>
          <TableHeader className='sticky top-0 z-10'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan} className={cn('bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted', header.column.columnDef.meta?.className ?? '')}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className='overflow-y-auto overflow-x-auto'>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className='group/row'>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn('bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted', cell.column.columnDef.meta?.className ?? '')}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>暂无数据</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='mt-4'>
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}

