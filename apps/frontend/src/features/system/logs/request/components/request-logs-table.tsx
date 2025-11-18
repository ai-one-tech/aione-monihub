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
import { type LogResponse } from '../../data/api-schema'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { OverflowPreview } from '@/components/overflow-preview'
import { parse } from 'date-fns'
import { useApplicationsQuery } from '@/features/applications/hooks/use-applications-query'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> { className: string }
}

// 宽内容列使用 LongText 展示，避免撑表格

type DataTableProps = {
  data: LogResponse[]
  totalPages: number
  search: Record<string, unknown>
  navigate: NavigateFn
  exportUrl: string
  onRefresh?: () => Promise<void>
}

export function RequestLogsTable({ data = [], totalPages, search, navigate, exportUrl, onRefresh }: DataTableProps) {
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
    { accessorKey: 'timestamp', header: '时间', meta: { className: 'w-[120px]' }, cell: ({ row }) => formatLocalTimestamp(row.original.timestamp) },
    { accessorKey: 'method', header: '方法', meta: { className: 'w-[60px]' }, cell: ({ row }) => row.original.method ?? '' },
    { accessorKey: 'path', header: 'URL', meta: { className: 'w-[150px]' }, cell: ({ row }) => <OverflowPreview value={row.original.path ?? ''} title='URL' /> },
    { accessorKey: 'status', header: '状态码', meta: { className: 'w-[100px]' }, cell: ({ row }) => row.original.status ?? '' },
    { accessorKey: 'application_name', header: '应用', meta: { className: 'w-[160px]' }, cell: ({ row }) => applicationNameMap.get(row.original.user_id) ?? '-' },
    { accessorKey: 'instance_hostname', header: '实例主机名', meta: { className: 'w-[180px]' }, cell: () => '-' },
    { accessorKey: 'ip_address', header: 'IP', meta: { className: 'w-[150px]' }, cell: ({ row }) => <OverflowPreview value={row.original.ip_address ?? ''} title='IP' /> },
    { accessorKey: 'user_agent', header: 'UA', meta: { className: 'w-[150px]' }, cell: ({ row }) => <OverflowPreview value={row.original.user_agent ?? ''} title='UA' /> },
    { accessorKey: 'duration_ms', header: '耗时(ms)', meta: { className: 'w-[100px]' }, cell: ({ row }) => row.original.duration_ms ?? '' },
    { accessorKey: 'trace_id', header: 'TraceID', meta: { className: 'w-[160px]' }, cell: ({ row }) => row.original.trace_id ?? '' },
    { accessorKey: 'request_headers', header: '请求头', meta: { className: 'w-[150px]' }, cell: ({ row }) => <OverflowPreview value={row.original.request_headers ?? {}} title='请求头' /> },
    { accessorKey: 'request_body', header: '请求体', meta: { className: 'w-[150px]' }, cell: ({ row }) => <OverflowPreview value={row.original.request_body ?? ''} title='请求体' /> },
    { accessorKey: 'response_body', header: '响应体', meta: { className: 'w-[150px]' }, cell: ({ row }) => <OverflowPreview value={row.original.response_body ?? ''} title='响应体' /> },
    { accessorKey: 'log_type', header: '类型', meta: { className: 'w-[100px]' }, cell: () => 'request' },
    { accessorKey: 'log_source', header: '来源', meta: { className: 'w-[120px]' } },
  ], [applicationNameMap])

  const { columnFilters, onColumnFiltersChange, pagination, onPaginationChange, ensurePageInRange } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: DEFAULT_PAGE, defaultPageSize: DEFAULT_PAGE_SIZE },
    globalFilter: { enabled: true, key: 'keyword' },
    columnFilters: [
      { columnId: 'method', searchKey: 'method', type: 'string' },
      { columnId: 'status', searchKey: 'status', type: 'string' },
      { columnId: 'path', searchKey: 'url', type: 'string' },
    ],
  })

  const doRefresh = async () => {
    if (onRefresh) {
      await onRefresh()
    } else if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

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
    meta: { onRefresh: doRefresh },
  })

  useEffect(() => { ensurePageInRange(totalPages) }, [totalPages, ensurePageInRange])

  return (
    <div className='flex flex-col h-full min-h-0 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='搜索URL或内容...'
        filters={[
          { columnId: 'method', title: '方法', options: [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' },
            { label: 'PATCH', value: 'PATCH' },
          ], multiSelect: false },
          { columnId: 'status', title: '状态码', options: [
            { label: '200', value: '200' },
            { label: '400', value: '400' },
            { label: '404', value: '404' },
            { label: '500', value: '500' },
          ], multiSelect: false },
        ]}
      />
      <div className='flex-1 flex min-h-0 overflow-auto rounded-md border mt-4'>
        <Table>
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
          <TableBody>
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