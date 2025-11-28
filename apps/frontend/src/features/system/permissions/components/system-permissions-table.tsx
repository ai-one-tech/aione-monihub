import { useState } from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { type ApiPermissionResponse } from '../data/api-schema'
import { systemPermissionsColumns as columns } from './system-permissions-columns'
import { SystemPermissionsDataTableBulkActions } from './system-permissions-data-table-bulk-actions'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className: string
  }
}

type DataTableProps = {
  data: ApiPermissionResponse[]
  totalPages: number
  search: Record<string, unknown>
  navigate: NavigateFn
  onRefresh?: () => void
}

export function SystemPermissionsTable({
  data = [],
  totalPages,
  search,
  navigate,
  onRefresh,
}: DataTableProps) {
  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  // Synced with URL states (keys/defaults mirror system permissions route search schema)
  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: {
      defaultPage: DEFAULT_PAGE,
      defaultPageSize: DEFAULT_PAGE_SIZE,
    },
    globalFilter: { enabled: false },
    columnFilters: [
      // name per-column text filter
      { columnId: 'name', searchKey: 'name', type: 'string' },
      // { columnId: 'resource', searchKey: 'resource', type: 'array' },
      {
        columnId: 'permission_type',
        searchKey: 'permission_type',
        type: 'array',
        arraySerialization: 'string',
      },
      {
        columnId: 'action',
        searchKey: 'action',
        type: 'array',
        arraySerialization: 'string',
      },
    ],
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
    enableRowSelection: true,
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: { onRefresh },
  })

  return (
    <div className='flex h-full min-h-0 flex-col max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='搜索权限...'
        searchKey='name'
        filters={[
          {
            columnId: 'permission_type',
            title: '类型',
            options: [
              { label: '菜单', value: 'menu' },
              { label: '操作', value: 'action' },
              { label: '页面', value: 'page' },
            ],
            multiSelect: true,
          },
          {
            columnId: 'action',
            title: '操作',
            options: [
              { label: '管理', value: 'manage' },
              { label: '创建', value: 'create' },
              { label: '读取', value: 'read' },
              { label: '更新', value: 'update' },
              { label: '删除', value: 'delete' },
              { label: '导入', value: 'import' },
              { label: '导出', value: 'export' },
            ],
            multiSelect: true,
          },
        ]}
      />
      <div className='mt-4 min-h-0 flex-1 overflow-auto rounded-md border'>
        <Table>
          <TableHeader className='sticky top-0 z-10'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        header.column.columnDef.meta?.className ?? ''
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className ?? ''
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='mt-4'>
        <DataTablePagination table={table} />
      </div>
      <SystemPermissionsDataTableBulkActions table={table} />
    </div>
  )
}
