import { useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/date-picker'
import { useInstanceReports } from '../hooks/use-instance-reports'
import { InstanceReportList } from './instances-report-list'
import { type InstanceResponse } from '../data/api-schema'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { DataTablePagination } from '@/components/data-table'
import { addDays, format } from 'date-fns'

interface InstanceReportDrawerProps {
  instance: InstanceResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InstanceReportDrawer({ instance, open, onOpenChange }: InstanceReportDrawerProps) {
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  const queryParams = {
    page,
    limit: 20,
    start_time: startDate ? format(startDate, "yyyy-MM-dd'T'00:00:00'Z'") : undefined,
    end_time: endDate ? format(endDate, "yyyy-MM-dd'T'23:59:59'Z'") : undefined,
  }

  const { data, isLoading, error, refetch } = useInstanceReports(instance?.id || '', queryParams)

  const handleQuickFilter = (days: number) => {
    const today = new Date()
    if (days === 0) {
      setStartDate(today)
      setEndDate(today)
    } else {
      setStartDate(addDays(today, -days))
      setEndDate(today)
    }
    setPage(1)
  }

  const handleClearFilter = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setPage(1)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='sm:max-w-4xl w-full flex flex-col'>
        <SheetHeader className='px-6 pt-6 flex-shrink-0'>
          <SheetTitle>实例上报记录 - {instance?.name}</SheetTitle>
          <SheetDescription>
            查看实例的历史数据上报记录，共 {instance?.report_count || 0} 次上报
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 flex flex-col overflow-hidden'>
          {/* 时间过滤器 */}
          <div className='px-4 pt-6 pb-4 flex-shrink-0'>
            <div className='flex flex-wrap gap-2 items-center'>
              <div className='flex gap-2 items-center'>
                <span className='text-sm text-muted-foreground'>开始时间:</span>
                <DatePicker
                  selected={startDate}
                  onSelect={setStartDate}
                  placeholder='选择开始日期'
                />
                <span className='text-sm text-muted-foreground'>结束时间:</span>
                <DatePicker
                  selected={endDate}
                  onSelect={setEndDate}
                  placeholder='选择结束日期'
                />
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' onClick={() => handleQuickFilter(0)}>
                  今天
                </Button>
                <Button variant='outline' size='sm' onClick={() => handleQuickFilter(7)}>
                  最近7天
                </Button>
                <Button variant='outline' size='sm' onClick={() => handleQuickFilter(30)}>
                  最近30天
                </Button>
                <Button variant='outline' size='sm' onClick={handleClearFilter}>
                  清除
                </Button>
              </div>
            </div>
          </div>

          {/* 记录列表 */}
          <div className='flex-1 overflow-auto px-4 pb-4'>
            {isLoading ? (
              <div className='space-y-4'>
                <Skeleton className='h-32 w-full' />
                <Skeleton className='h-32 w-full' />
                <Skeleton className='h-32 w-full' />
              </div>
            ) : error ? (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  加载上报记录失败：{(error as Error).message}
                  <button onClick={() => refetch()} className='ml-2 underline'>
                    重试
                  </button>
                </AlertDescription>
              </Alert>
            ) : (
              <InstanceReportList
                reports={data?.data || []}
              />
            )}
          </div>

          {/* 分页组件 - 固定在底部 */}
          {(data?.pagination.total && Math.ceil(data.pagination.total / (data?.pagination.limit || 20)) > 1) && (
            <div className='flex-shrink-0 px-4 py-4 border-t bg-background'>
              <DataTablePagination
                table={{
                  getState: () => ({ pagination: { pageIndex: page - 1, pageSize: data?.pagination.limit || 20 } }),
                  getPageCount: () => Math.ceil((data?.pagination.total || 0) / (data?.pagination.limit || 20)),
                  setPageIndex: (index: number) => setPage(index + 1),
                  getCanPreviousPage: () => page > 1,
                  getCanNextPage: () => page < Math.ceil((data?.pagination.total || 0) / (data?.pagination.limit || 20)),
                  previousPage: () => setPage(page - 1),
                  nextPage: () => setPage(page + 1),
                  setPageSize: () => {},
                  setRowIndex: () => {},
                  resetRowState: () => {},
                  getCanPreviousRow: () => false,
                  getCanNextRow: () => false,
                  firstPage: () => setPage(1),
                  lastPage: () => setPage(Math.ceil((data?.pagination.total || 0) / (data?.pagination.limit || 20))),
                  getCoreRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
                  getRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
                  getFilteredRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
                  getSortedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
                  getExpandedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
                  getPaginationRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
                  getSelectedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
                  getGroupedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
                  options: {},
                  initialState: {},
                  setState: () => {},
                  _features: [],
                  getAllColumns: () => [],
                  getAllFlatColumns: () => [],
                  getAllLeafColumns: () => [],
                  getColumn: () => null,
                  getCenterLeafColumns: () => [],
                  getLeftLeafColumns: () => [],
                  getRightLeafColumns: () => [],
                  getIsSomeColumnsPinned: () => false,
                  getIsSomePageRowsSelected: () => false,
                  getIsAllPageRowsSelected: () => false,
                  getIsAllRowsSelected: () => false,
                  getSomeSelectedRows: () => [],
                  getSelectedRows: () => new Map(),
                  getPreSelectedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
                } as any}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
