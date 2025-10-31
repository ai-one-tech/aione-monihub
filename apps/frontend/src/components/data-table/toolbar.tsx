import { useEffect, useState } from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebouncedCallback } from '@/hooks/use-debounce'
import { DataTableFacetedFilter } from './faceted-filter'
import { DataTableViewOptions } from './view-options'

type DataTableToolbarProps<TData> = {
  table: Table<TData>
  searchPlaceholder?: string
  searchKey?: string
  filters?: {
    columnId: string
    title: string
    options: {
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }[]
  }[]
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Filter...',
  searchKey,
  filters = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || table.getState().globalFilter

  // 本地输入值，提供即时反馈；与表格过滤值保持同步
  const initialColumnValue = searchKey
    ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? '')
    : (table.getState().globalFilter ?? '')

  const [localValue, setLocalValue] = useState(initialColumnValue)
  const [isComposing, setIsComposing] = useState(false)

  // 当外部（URL或表格状态）变化时，同步本地显示
  useEffect(() => {
    const current = searchKey
      ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? '')
      : (table.getState().globalFilter ?? '')
    setLocalValue(current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey ? table.getColumn(searchKey)?.getFilterValue() : table.getState().globalFilter])

  // 防抖更新：延迟应用过滤条件，期间继续输入则继续推迟
  const debouncedApply = useDebouncedCallback((value: string) => {
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value)
    } else {
      table.setGlobalFilter(value)
    }
  }, 300)

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder={searchPlaceholder}
          value={localValue}
          onChange={(event) => {
            const next = event.target.value
            setLocalValue(next)
            if (!isComposing) {
              debouncedApply(next)
            }
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(event) => {
            setIsComposing(false)
            const finalValue = event.currentTarget.value
            setLocalValue(finalValue)
            debouncedApply(finalValue)
          }}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        <div className='flex gap-x-2'>
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId)
            if (!column) return null
            return (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={column}
                title={filter.title}
                options={filter.options}
              />
            )
          })}
        </div>
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter('')
            }}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Cross2Icon className='ms-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
