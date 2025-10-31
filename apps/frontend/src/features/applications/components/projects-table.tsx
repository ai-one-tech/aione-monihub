import { useState, useEffect } from 'react'
import { type NavigateOptions } from '@tanstack/react-router'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, Eye, Edit, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useProjectsContext } from './projects-provider'
import { type ProjectResponse, PROJECT_STATUS_OPTIONS, PROJECT_STATUS_LABELS } from '../data/api-schema'
import { useDebouncedCallback } from '@/hooks/use-debounce'

interface ProjectsTableProps {
  data: ProjectResponse[]
  search: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
  }
  navigate: (options: NavigateOptions) => void
}

export function ProjectsTable({ data, search, navigate }: ProjectsTableProps) {
  const {
    openEditProject,
    openProjectDetail,
    openDeleteDialog,
  } = useProjectsContext()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  
  // Local state for input values to provide immediate UI feedback
  const [localSearchValue, setLocalSearchValue] = useState(search.search || '')
  
  // Sync local state when search prop changes (e.g., from URL navigation)
  useEffect(() => {
    setLocalSearchValue(search.search || '')
  }, [search.search])

  const columns: ColumnDef<ProjectResponse>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-8 px-2'
        >
          项目ID
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => (
        <div className='font-mono text-xs'>
          {row.getValue('id')}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-8 px-2'
        >
          项目名称
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => (
        <div className='font-medium'>{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'code',
      header: '项目代码',
      cell: ({ row }) => (
        <div className='font-mono text-sm'>{row.getValue('code')}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: '项目描述',
      cell: ({ row }) => {
        const description = row.getValue('description') as string
        return (
          <div className='max-w-[200px] truncate text-muted-foreground'>
            {description || '暂无描述'}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {PROJECT_STATUS_LABELS[status as keyof typeof PROJECT_STATUS_LABELS]}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-8 px-2'
        >
          创建时间
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => (
        <div className='text-sm text-muted-foreground'>
          {new Date(row.getValue('created_at')).toLocaleDateString('zh-CN')}
        </div>
      ),
    },
    {
      accessorKey: 'updated_at',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-8 px-2'
        >
          更新时间
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => (
        <div className='text-sm text-muted-foreground'>
          {new Date(row.getValue('updated_at')).toLocaleDateString('zh-CN')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const project = row.original

        return (
          <div className='flex items-center space-x-1'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => openProjectDetail(project)}
                  >
                    <Eye className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>查看详情</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => openEditProject(project)}
                  >
                    <Edit className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>编辑项目</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => openDeleteDialog(project)}
                    className='text-destructive hover:text-destructive'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>删除项目</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Debounced search function with 2 second delay
  const debouncedSearchChange = useDebouncedCallback((value: string) => {
    navigate({
      search: (prev) => ({ ...prev, search: value || undefined, page: 1 }),
    })
  }, 1000)
  
  // Immediate handler for search input - updates local state and triggers debounced search
  const handleSearchChange = (value: string) => {
    setLocalSearchValue(value)
    debouncedSearchChange(value)
  }

  // Debounced status change function with 2 second delay
  const debouncedStatusChange = useDebouncedCallback((value: string) => {
    navigate({
      search: (prev) => ({ 
        ...prev, 
        status: value === 'all' ? undefined : value, 
        page: 1 
      }),
    })
  }, 2000)
  
  // Handler for status change
  const handleStatusChange = (value: string) => {
    debouncedStatusChange(value)
  }

  return (
    <div className='w-full'>
      {/* 筛选区域 */}
      <div className='flex items-center space-x-2 py-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='搜索项目名称...'
            value={localSearchValue}
            onChange={(event) => handleSearchChange(event.target.value)}
            className='pl-10'
          />
        </div>
        <Select
          value={search.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='选择状态' />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 表格 */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
    </div>
  )
}