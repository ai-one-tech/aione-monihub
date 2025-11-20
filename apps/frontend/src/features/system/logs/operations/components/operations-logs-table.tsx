import { useMemo, useState, useEffect } from 'react'
import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, type SortingState, type VisibilityState, useReactTable } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTableToolbar, DataTablePagination } from '@/components/data-table'
import { Input } from '@/components/ui/input'
import { toLocalInput, fromLocalInputToIso } from '@/lib/datetime'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import { type AuditLogItem } from '../../operations/data/api-schema'
import { OperationLogDetailDialog } from './operation-log-detail-dialog'

type Props = {
  data: AuditLogItem[]
  totalPages: number
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function OperationsLogsTable({ data = [], totalPages, search, navigate }: Props) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [detailId, setDetailId] = useState<string | null>(null)

  const columns: ColumnDef<AuditLogItem, any>[] = useMemo(() => [
    { accessorKey: 'timestamp', header: '操作时间', meta: { className: 'w-[180px]' }, cell: ({ row }) => row.original.timestamp },
    { accessorKey: 'user', header: '操作用户', meta: { className: 'w-[160px]' } },
    { accessorKey: 'ip', header: '操作IP', meta: { className: 'w-[140px]' } },
    { accessorKey: 'trace_id', header: 'TraceID', meta: { className: 'min-w-[200px]' } },
    { accessorKey: 'table', header: '操作的表', meta: { className: 'w-[160px]' } },
    { accessorKey: 'operation', header: '类型', meta: { className: 'w-[120px]' } },
    { id: 'actions', header: '操作', meta: { className: 'w-[120px]' }, cell: ({ row }) => (
      <Button variant='outline' size='sm' onClick={() => setDetailId(row.original.id)}>查看详情</Button>
    ) },
  ], [])

  const { columnFilters, onColumnFiltersChange, pagination, onPaginationChange, ensurePageInRange } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: false },
    columnFilters: [
      { columnId: 'user', searchKey: 'user', type: 'string' },
      { columnId: 'ip', searchKey: 'ip', type: 'string' },
      { columnId: 'trace_id', searchKey: 'trace_id', type: 'string' },
      { columnId: 'table', searchKey: 'table', type: 'string' },
      { columnId: 'operation', searchKey: 'operation', type: 'string' },
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
  })

  useEffect(() => { ensurePageInRange(totalPages) }, [totalPages, ensurePageInRange])

  const opOptions = [
    { label: '新增', value: 'create' },
    { label: '更新', value: 'update' },
    { label: '删除', value: 'delete' },
  ]

  

  return (
    <div className='flex flex-col h-full min-h-0'>
      <DataTableToolbar table={table} searchPlaceholder='搜索 TraceID...' filters={[{ columnId: 'operation', title: '操作类型', options: opOptions, multiSelect: false }]} />

      <div className='mt-3 grid grid-cols-2 md:grid-cols-4 gap-2'>
        <Input placeholder='操作用户' value={(table.getColumn('user')?.getFilterValue() as string) || ''} onChange={(e) => table.getColumn('user')?.setFilterValue(e.target.value)} />
        <Input placeholder='操作IP' value={(table.getColumn('ip')?.getFilterValue() as string) || ''} onChange={(e) => table.getColumn('ip')?.setFilterValue(e.target.value)} />
        <Input placeholder='TraceID' value={(table.getColumn('trace_id')?.getFilterValue() as string) || ''} onChange={(e) => table.getColumn('trace_id')?.setFilterValue(e.target.value)} />
        <Input placeholder='操作的表' value={(table.getColumn('table')?.getFilterValue() as string) || ''} onChange={(e) => table.getColumn('table')?.setFilterValue(e.target.value)} />
      </div>

      <div className='mt-2 grid grid-cols-2 gap-2'>
        <Input type='datetime-local' value={toLocalInput(search['start_date'] as string | undefined)} onChange={(e) => navigate({ search: (prev) => ({ ...prev, page: undefined, start_date: fromLocalInputToIso(e.target.value) }) })} />
        <Input type='datetime-local' value={toLocalInput(search['end_date'] as string | undefined)} onChange={(e) => navigate({ search: (prev) => ({ ...prev, page: undefined, end_date: fromLocalInputToIso(e.target.value) }) })} />
      </div>

      <div className='flex-1 min-h-0 overflow-auto rounded-md border mt-4'>
        <Table>
          <TableHeader className='sticky top-0 z-10'>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className='group/row'>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} colSpan={h.colSpan} className={cn('bg-background group-hover/row:bg-muted', h.column.columnDef.meta?.className ?? '')}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className='group/row'>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn('bg-background group-hover/row:bg-muted', cell.column.columnDef.meta?.className ?? '')}>
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

      <OperationLogDetailDialog id={detailId} open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)} />
    </div>
  )
}