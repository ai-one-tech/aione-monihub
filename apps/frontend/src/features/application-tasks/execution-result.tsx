import React from 'react'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

const toText = (v: any) => JSON.stringify(v ?? null, null, 2)
const renderPre = (_taskType: string | null, data: any, className: string) => (
  <pre className={className}>{toText(data)}</pre>
)

interface ExecutionResultPanelProps {
  selectedInstanceResult: any | null
  selectedTaskType: string | null
  copyToClipboard: (content: string) => Promise<void> | void
}

export function ExecutionResultPanel({ selectedInstanceResult, selectedTaskType, copyToClipboard }: ExecutionResultPanelProps) {
  if (!selectedInstanceResult) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>请先选择一个任务，然后选择实例查看执行结果</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 rounded-lg border bg-gray-50 dark:bg-accent p-4">
      <div className="flex flex-col min-h-0 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm shrink-0">
          {selectedInstanceResult.execution_record.duration_ms && (
            <div>
              <span className="font-medium">执行时长:</span>
              <div className="text-gray-600">
                {(selectedInstanceResult.execution_record.duration_ms / 1000).toFixed(2)}秒
              </div>
            </div>
          )}

          {selectedInstanceResult.execution_record.end_time && (
            <div>
              <span className="font-medium">结束时间:</span>
              <div className="text-gray-600">
                {new Date(selectedInstanceResult.execution_record.end_time).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <div className='flex-1 overflow-auto min-h-0'>
          {selectedInstanceResult.execution_record.status === 'success' && (
            <div>
              {selectedInstanceResult.execution_record.result_message && (
                <div>
                  <div className="font-medium text-sm mb-1 text-green-700">执行结果:</div>
                  <div className="text-sm text-gray-700 bg-green-50 p-3 rounded border border-green-200">{toText(selectedInstanceResult.execution_record.result_message)}</div>
                </div>
              )}

              {selectedInstanceResult.execution_record.result_data && (
                <div className="flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm text-primary">输出数据:</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => {
                        const data = selectedInstanceResult.execution_record.result_data
                        copyToClipboard(String(toText(data)))
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {renderPre(
                    selectedTaskType,
                    selectedInstanceResult.execution_record.result_data,
                    'flex-1 h-full overflow-auto text-sm font-mono text-white bg-gray-800 p-3 rounded border border-green-200 dark:text-gray-800 dark:bg-white dark:border-green-800 whitespace-pre-wrap'
                  )}
                </div>
              )}
            </div>
          )}

          {selectedInstanceResult.execution_record.status === 'failed' && (
            <div className="space-y-3">
              {selectedInstanceResult.execution_record.error_message && (
                <div>
                  <div className="font-medium text-sm mb-1 text-red-700">错误信息:</div>
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">{toText(selectedInstanceResult.execution_record.error_message)}</div>
                </div>
              )}

              {selectedInstanceResult.execution_record.result_message && (
                <div>
                  <div className="font-medium text-sm mb-1 text-red-700">失败详情:</div>
                  <div className="text-sm text-gray-700 bg-red-50 p-3 rounded border border-red-200">{toText(selectedInstanceResult.execution_record.result_message)}</div>
                </div>
              )}

              {selectedInstanceResult.execution_record.result_data && (
                <div>
                  <div className="font-medium text-sm mb-1 text-red-700">错误数据:</div>
                  {renderPre(
                    selectedTaskType,
                    selectedInstanceResult.execution_record.result_data,
                    'text-sm font-mono text-gray-800 bg-red-50 p-3 rounded border border-red-200 whitespace-pre-wrap max-h-96 overflow-auto'
                  )}
                </div>
              )}
            </div>
          )}

          {selectedInstanceResult.execution_record.status !== 'success' && selectedInstanceResult.execution_record.status !== 'failed' && (
            <div className="space-y-3">
              {selectedInstanceResult.execution_record.result_message && (
                <div>
                  <div className="font-medium text-sm mb-1">状态消息:</div>
                  <div className="text-sm text-gray-600 bg-white p-3 rounded border">{toText(selectedInstanceResult.execution_record.result_message)}</div>
                </div>
              )}

              {selectedInstanceResult.execution_record.error_message && (
                <div>
                  <div className="font-medium text-sm mb-1 text-orange-700">警告信息:</div>
                  <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">{toText(selectedInstanceResult.execution_record.error_message)}</div>
                </div>
              )}

              {selectedInstanceResult.execution_record.result_data && (
                <div>
                  <div className="font-medium text-sm mb-1">当前数据:</div>
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