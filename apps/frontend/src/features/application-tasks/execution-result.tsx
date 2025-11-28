import React from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const toText = (v: any) => JSON.stringify(v ?? null, null, 2)
const renderPre = (_taskType: string | null, data: any, className: string) => (
  <pre className={className}>{toText(data)}</pre>
)

function JsonTableView({ data }: { data: any }) {
  const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v)

  const formatValue = (value: any): React.ReactNode => {
    if (typeof value !== 'string') {
      return String(value)
    }

    const trimmed = value.trim()
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsed = JSON.parse(trimmed)
        return (
          <pre className='font-mono text-xs whitespace-pre-wrap'>
            {JSON.stringify(parsed, null, 2)}
          </pre>
        )
      } catch {
        return value
      }
    }

    return value
  }
  const renderRows = (
    v: any,
    k?: string,
    level: number = 0
  ): React.ReactNode[] => {
    const pad = { paddingLeft: `${level * 16}px` }
    const rows: React.ReactNode[] = []
    if (Array.isArray(v)) {
      if (k !== undefined)
        rows.push(
          <TableRow key={`grp-${level}-${k}`}>
            <TableCell colSpan={2} className='font-medium' style={pad}>
              {String(k)}
            </TableCell>
          </TableRow>
        )
      v.forEach((item, idx) => {
        if (isObj(item) || Array.isArray(item)) {
          rows.push(...renderRows(item, `[${idx}]`, level + 1))
        } else {
          rows.push(
            <TableRow key={`arr-${level}-${k}-${idx}`}>
              <TableCell
                className='break-words whitespace-normal'
                style={pad}
              >{`[${idx}]`}</TableCell>
              <TableCell className='break-words whitespace-normal'>
                {formatValue(item)}
              </TableCell>
            </TableRow>
          )
        }
      })
      return rows
    }
    if (isObj(v)) {
      if (k !== undefined)
        rows.push(
          <TableRow key={`grp-${level}-${k}`}>
            <TableCell colSpan={2} className='font-medium' style={pad}>
              {String(k)}
            </TableCell>
          </TableRow>
        )
      Object.entries(v).forEach(([ck, cv]) => {
        if (isObj(cv) || Array.isArray(cv)) {
          rows.push(...renderRows(cv, ck, level + 1))
        } else {
          rows.push(
            <TableRow key={`obj-${level}-${ck}`}>
              <TableCell className='break-words whitespace-normal' style={pad}>
                {ck}
              </TableCell>
              <TableCell className='break-words whitespace-normal'>
                {formatValue(cv)}
              </TableCell>
            </TableRow>
          )
        }
      })
      return rows
    }
    rows.push(
      <TableRow key={`prim-${level}-${k ?? 'root'}`}>
        <TableCell className='break-words whitespace-normal' style={pad}>
          {k ?? ''}
        </TableCell>
        <TableCell className='break-words whitespace-normal'>
          {formatValue(v)}
        </TableCell>
      </TableRow>
    )
    return rows
  }
  return (
    <Table className='table-fixed'>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[200px]'>字段</TableHead>
          <TableHead>值</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{renderRows(data)}</TableBody>
    </Table>
  )
}

interface ExecutionResultPanelProps {
  selectedInstanceResult: any | null
  selectedTaskType: string | null
  copyToClipboard: (content: string) => Promise<void> | void
}

export function ExecutionResultPanel({
  selectedInstanceResult,
  selectedTaskType,
  copyToClipboard,
}: ExecutionResultPanelProps) {
  if (!selectedInstanceResult) {
    return (
      <div className='py-8 text-center text-gray-500'>
        <p>请先选择一个任务，然后选择实例查看执行结果</p>
      </div>
    )
  }

  return (
    <div className='dark:bg-accent flex min-h-0 flex-1 flex-col rounded-lg border bg-gray-50 p-4'>
      <div className='flex min-h-0 flex-col space-y-4'>
        <div className='grid shrink-0 grid-cols-2 gap-4 text-sm'>
          {selectedInstanceResult.execution_record.duration_ms && (
            <div>
              <span className='font-medium'>执行时长:</span>
              <div className='text-gray-600'>
                {(
                  selectedInstanceResult.execution_record.duration_ms / 1000
                ).toFixed(2)}
                秒
              </div>
            </div>
          )}

          {selectedInstanceResult.execution_record.end_time && (
            <div>
              <span className='font-medium'>结束时间:</span>
              <div className='text-gray-600'>
                {new Date(
                  selectedInstanceResult.execution_record.end_time
                ).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <div className='min-h-0 flex-1 overflow-auto'>
          {selectedInstanceResult.execution_record.status === 'success' && (
            <div>
              {selectedInstanceResult.execution_record.result_message && (
                <div>
                  <div className='mb-1 text-sm font-medium text-green-700'>
                    执行结果:
                  </div>
                  <div className='rounded border border-green-200 bg-green-50 p-3 text-sm text-gray-700'>
                    {toText(
                      selectedInstanceResult.execution_record.result_message
                    )}
                  </div>
                </div>
              )}

              {selectedInstanceResult.execution_record.result_data && (
                <div className='min-h-0 flex-1'>
                  <Tabs defaultValue='raw' className='flex-1'>
                    <div className='mb-1 flex items-center justify-between'>
                      <TabsList>
                        <TabsTrigger value='raw'>Raw</TabsTrigger>
                        <TabsTrigger value='table'>Table</TabsTrigger>
                      </TabsList>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0 text-gray-400 hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-200'
                        onClick={() => {
                          const data =
                            selectedInstanceResult.execution_record.result_data
                          copyToClipboard(String(toText(data)))
                        }}
                      >
                        <Copy className='h-3 w-3' />
                      </Button>
                    </div>
                    <TabsContent value='raw' className='min-h-0 flex-1'>
                      {renderPre(
                        selectedTaskType,
                        selectedInstanceResult.execution_record.result_data,
                        'flex-1 h-full overflow-auto text-sm font-mono text-white bg-gray-800 p-3 rounded border border-green-200 dark:text-gray-800 dark:bg-white dark:border-green-800 whitespace-pre-wrap'
                      )}
                    </TabsContent>
                    <TabsContent value='table' className='min-h-0 flex-1'>
                      <ScrollArea className='h-full flex-1'>
                        <JsonTableView
                          data={
                            selectedInstanceResult.execution_record.result_data
                          }
                        />
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          )}

          {selectedInstanceResult.execution_record.status === 'failed' && (
            <div className='space-y-3'>
              {selectedInstanceResult.execution_record.error_message && (
                <div>
                  <div className='mb-1 text-sm font-medium text-red-700'>
                    错误信息:
                  </div>
                  <div className='rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
                    {toText(
                      selectedInstanceResult.execution_record.error_message
                    )}
                  </div>
                </div>
              )}

              {selectedInstanceResult.execution_record.result_message && (
                <div>
                  <div className='mb-1 text-sm font-medium text-red-700'>
                    失败详情:
                  </div>
                  <div className='rounded border border-red-200 bg-red-50 p-3 text-sm text-gray-700'>
                    {toText(
                      selectedInstanceResult.execution_record.result_message
                    )}
                  </div>
                </div>
              )}

              {selectedInstanceResult.execution_record.result_data && (
                <div>
                  <div className='mb-1 text-sm font-medium text-red-700'>
                    错误数据:
                  </div>
                  {renderPre(
                    selectedTaskType,
                    selectedInstanceResult.execution_record.result_data,
                    'text-sm font-mono text-gray-800 bg-red-50 p-3 rounded border border-red-200 whitespace-pre-wrap max-h-96 overflow-auto'
                  )}
                </div>
              )}
            </div>
          )}

          {selectedInstanceResult.execution_record.status !== 'success' &&
            selectedInstanceResult.execution_record.status !== 'failed' && (
              <div className='space-y-3'>
                {selectedInstanceResult.execution_record.result_message && (
                  <div>
                    <div className='mb-1 text-sm font-medium'>状态消息:</div>
                    <div className='rounded border bg-white p-3 text-sm text-gray-600'>
                      {toText(
                        selectedInstanceResult.execution_record.result_message
                      )}
                    </div>
                  </div>
                )}

                {selectedInstanceResult.execution_record.error_message && (
                  <div>
                    <div className='mb-1 text-sm font-medium text-orange-700'>
                      警告信息:
                    </div>
                    <div className='rounded border border-orange-200 bg-orange-50 p-3 text-sm text-orange-600'>
                      {toText(
                        selectedInstanceResult.execution_record.error_message
                      )}
                    </div>
                  </div>
                )}

                {selectedInstanceResult.execution_record.result_data && (
                  <div>
                    <div className='mb-1 text-sm font-medium'>当前数据:</div>
                    {renderPre(
                      selectedTaskType,
                      selectedInstanceResult.execution_record.result_data,
                      'text-sm font-mono text-gray-800 bg-white p-3 rounded border whitespace-pre-wrap max-h-96 overflow-auto'
                    )}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
