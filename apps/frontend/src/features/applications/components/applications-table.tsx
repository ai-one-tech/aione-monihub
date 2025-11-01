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
import { useApplicationsProvider } from './applications-provider'
import { type ApplicationResponse, APPLICATION_STATUS_OPTIONS, APPLICATION_STATUS_LABELS } from '../data/api-schema'
import { useDebounce } from '@/hooks/use-debounce'

interface ApplicationsTableProps {
  data: ApplicationResponse[]
  search: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
    project_id?: string
  }
  navigate: (options: NavigateOptions) => void
}

export function ApplicationsTable({ data, search, navigate }: ApplicationsTableProps) {
  const {
    setIsEditSheetOpen,
    setEditingApplication,
    setIsViewDialogOpen,
    setViewingApplication,
    setIsDeleteDialogOpen,
    setDeletingApplication,
  } = useApplicationsProvider()

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

  // 处理编辑操作
  const handleEdit = (application: ApplicationResponse) => {
    setEditingApplication(application)
    setIsEditSheetOpen(true)
  }

  // 处理查看详情
  const handleView = (application: ApplicationResponse) => {
    setViewingApplication(application)
    setIsViewDialogOpen(true)
  }

  // 处理删除操作
  const handleDelete = (application: ApplicationResponse) => {
    setDeletingApplication(application)
    setIsDeleteDialogOpen(true)
  }

  const columns: ColumnDef<ApplicationResponse>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-8 px-2'
        >
          应用ID
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
          应用名称
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => (
        <div className='font-medium'>{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'code',
      header: '应用代码',
      cell: ({ row }) => (
        <div className='font-mono text-sm'>{row.getValue('code')}</div>
      ),
    },
    {
      accessorKey: 'project_id',
      header: '所属项目',
      cell: ({ row }) => (
        <div className='font-mono text-xs text-muted-foreground'>
          {row.getValue('project_id')}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: '应用描述',
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
            {APPLICATION_STATUS_LABELS[status as keyof typeof APPLICATION_STATUS_LABELS]}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'authorization',
      header: '授权用户',
      cell: ({ row }) => {
        const authorization = row.getValue('authorization') as { users: string[]; expiry_date: string | null }
        return (
          <div className='text-sm text-muted-foreground'>
            {authorization.users.length > 0 ? (
              <span>{authorization.users.length} 个用户</span>
            ) : (
              <span>无授权用户</span>
            )}
          </div>
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
        const application = row.original

        return (
          <div className='flex items-center space-x-1'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleView(application)}
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
                    onClick={() => handleEdit(application)}
                  >
                    <Edit className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>编辑应用</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleDelete(application)}
                    className='text-destructive hover:text-destructive'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>删除应用</p>
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
  const debouncedSearch = useDebounce(localSearchValue)
  
  // Effect to trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== search.search) {
      navigate({
        search: (prev) => ({ ...prev, search: debouncedSearch || undefined, page: 1 }),
      })
    }
  }, [debouncedSearch, search.search, navigate])
  
  // Immediate handler for search input - updates local state
  const handleSearchChange = (value: string) => {
    setLocalSearchValue(value)
  }

  // Handler for status change
  const handleStatusChange = (value: string) => {
    navigate({
      search: (prev) => ({ 
        ...prev, 
        status: value === 'all' ? undefined : value, 
        page: 1 
      }),
    })
  }

  return (
    <div className='w-full'>
      {/* 筛选区域 */}
      <div className='flex items-center space-x-2 py-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='搜索应用名称...'
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
            {APPLICATION_STATUS_OPTIONS.map((option) => (
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