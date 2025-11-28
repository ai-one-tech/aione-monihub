import { useEffect, useState } from 'react'
import { type NavigateOptions } from '@tanstack/react-router'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
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
import {
  type ApplicationResponse,
  APPLICATION_STATUS_OPTIONS,
} from '../data/api-schema'
import { applicationsColumns as columns } from './applications-columns'

const TECH_STACK_OPTIONS = [
  { label: 'java', value: 'java' },
  { label: 'springboot', value: 'springboot' },
  { label: 'golang', value: 'golang' },
  { label: 'gin', value: 'gin' },
  { label: 'rust', value: 'rust' },
  { label: 'actix', value: 'actix' },
  { label: 'javascript', value: 'javascript' },
  { label: 'vue', value: 'vue' },
  { label: 'react', value: 'react' },
  { label: 'flutter', value: 'flutter' },
  { label: 'uniapp', value: 'uniapp' },
  { label: 'nativereact', value: 'nativereact' },
  { label: 'python', value: 'python' },
  { label: 'fastapi', value: 'fastapi' },
]

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className: string
  }
}

type DataTableProps = {
  data: ApplicationResponse[]
  totalPages: number
  search: Record<string, unknown>
  navigate: NavigateFn
  onRefresh?: () => void
}

export function ApplicationsTable({
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

  // Synced with URL states
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
      { columnId: 'name', searchKey: 'search', type: 'string' },
      { columnId: 'status', searchKey: 'status', type: 'string' }, // 改为字符串类型
      { columnId: 'tech_stacks', searchKey: 'tech_stack', type: 'string' },
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

  useEffect(() => {
    ensurePageInRange(totalPages)
  }, [totalPages, ensurePageInRange])

  return (
    <div className='flex h-full min-h-0 flex-col max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='搜索应用...'
        searchKey='name'
        filters={[
          {
            columnId: 'status',
            title: '状态',
            options: APPLICATION_STATUS_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            })),
            multiSelect: false, // 设置为单选模式
          },
          {
            columnId: 'tech_stacks',
            title: '技术栈',
            options: TECH_STACK_OPTIONS,
            multiSelect: false,
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
    </div>
  )
}
