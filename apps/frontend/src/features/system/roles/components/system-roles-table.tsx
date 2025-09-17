import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table/pagination'
import { DataTableToolbar } from '@/components/data-table/toolbar'
import { systemRolesColumns } from './system-roles-columns'
import { type ApiRoleResponse } from '../data/api-schema'

interface SystemRolesTableProps {
  data: ApiRoleResponse[]
  search: any
  navigate: any
}

export function SystemRolesTable({ data, search, navigate }: SystemRolesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns: systemRolesColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  const handleSearch = (value: string) => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        page: 1,
        search: value || undefined,
      }),
    })
  }

  const handlePageChange = (page: number) => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        page,
      }),
    })
  }

  const handlePageSizeChange = (pageSize: number) => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        page: 1,
        pageSize,
      }),
    })
  }

  return (
    <div className='space-y-4'>
      <DataTableToolbar
        table={table}
        searchKey='name'
        searchPlaceholder='搜索角色名称...'
        onSearch={handleSearch}
        searchValue={search.search || ''}
      />
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  colSpan={systemRolesColumns.length}
                  className='h-24 text-center'
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        currentPage={search.page || 1}
        pageSize={search.pageSize || 10}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}