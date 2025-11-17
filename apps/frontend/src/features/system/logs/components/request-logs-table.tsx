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
import { LongText } from '@/components/long-text'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { type LogResponse } from '../data/api-schema'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'

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

  const columns: ColumnDef<LogResponse, any>[] = useMemo(() => [
    { accessorKey: 'timestamp', header: '时间', meta: { className: 'w-[100px]' }, cell: ({ row }) => row.original.timestamp },
    { accessorKey: 'method', header: '方法', meta: { className: 'w-[20px]' }, cell: ({ row }) => row.original.method ?? '' },
    { accessorKey: 'path', header: 'URL', meta: { className: 'min-w-[200px]' }, cell: ({ row }) => <LongText className='w-[200px]'>{row.original.path ?? ''}</LongText> },
    { accessorKey: 'status', header: '状态码', meta: { className: 'w-[100px]' }, cell: ({ row }) => row.original.status ?? '' },
    { accessorKey: 'ip_address', header: 'IP', meta: { className: 'w-[140px]' } },
    { accessorKey: 'user_agent', header: 'UA', meta: { className: 'w-[100px]' },
      cell: ({ row }) => (
        <LongText className='w-[100px]'>
          {row.original.user_agent ?? ''}
        </LongText>
      )
    },
    { accessorKey: 'duration_ms', header: '耗时(ms)', meta: { className: 'w-[80px]' }, cell: ({ row }) => row.original.duration_ms ?? '' },
    { accessorKey: 'trace_id', header: 'TraceID', meta: { className: 'w-[160px]' }, cell: ({ row }) => row.original.trace_id ?? '' },
    { accessorKey: 'request_headers', header: '请求头', meta: { className: 'min-w-[200px]' }, cell: ({ row }) => <LongText className='w-[200px]'>{JSON.stringify(row.original.request_headers ?? {})}</LongText> },
    { accessorKey: 'request_body', header: '请求体', meta: { className: 'min-w-[200px]' }, cell: ({ row }) => <LongText className='w-[200px]'>{JSON.stringify(row.original.request_body ?? '')}</LongText> },
    { accessorKey: 'response_body', header: '响应体', meta: { className: 'min-w-[200px]' }, cell: ({ row }) => <LongText className='w-[200px]'>{JSON.stringify(row.original.response_body ?? '')}</LongText> },
    { accessorKey: 'log_source', header: '来源', meta: { className: 'w-[120px]' } },
  ], [])

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
      <div className='flex-1 min-h-0 overflow-x-auto overflow-y-auto rounded-md border mt-4'>
        <Table className='w-full min-w-max'>
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