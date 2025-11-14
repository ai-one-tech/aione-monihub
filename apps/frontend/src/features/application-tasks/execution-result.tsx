import React from 'react'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

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
                  <div className="text-sm text-gray-700 bg-green-50 p-3 rounded border border-green-200">
                    {typeof selectedInstanceResult.execution_record.result_message === 'string'
                      ? selectedInstanceResult.execution_record.result_message
                      : JSON.stringify(selectedInstanceResult.execution_record.result_message, null, 2)}
                  </div>
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
                        const content = (() => {
                          const isShellTask = selectedTaskType === 'shell_exec'
                          if (isShellTask && typeof selectedInstanceResult.execution_record.result_data === 'object') {
                            const resultObj = selectedInstanceResult.execution_record.result_data as any
                            if (resultObj.output) return resultObj.output
                          }
                          return typeof selectedInstanceResult.execution_record.result_data === 'string'
                            ? selectedInstanceResult.execution_record.result_data
                            : JSON.stringify(selectedInstanceResult.execution_record.result_data, null, 2)
                        })()
                        copyToClipboard(String(content))
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {(() => {
                    const isShellTask = ['shell_exec', 'run_code'].includes(selectedTaskType || '')
                    if (isShellTask && typeof selectedInstanceResult.execution_record.result_data === 'object') {
                      const resultObj = selectedInstanceResult.execution_record.result_data as any
                      if (resultObj.output !== undefined && resultObj.output !== null) {
                        return (
                          <pre className="text-sm font-mono text-white bg-gray-800 p-3 rounded border border-green-200 dark:text-gray-800 dark:bg-white dark:border-green-800 whitespace-pre-wrap">
                            {typeof resultObj.output === 'string' ? resultObj.output : JSON.stringify(resultObj.output, null, 2)}
                          </pre>
                        )
                      }
                    }
                    return (
                      <pre className="flex-1 h-full overflow-auto text-sm font-mono text-white bg-gray-800 p-3 rounded border border-green-200 dark:text-gray-800 dark:bg-white dark:border-green-800 whitespace-pre-wrap">
                        {typeof selectedInstanceResult.execution_record.result_data === 'string'
                          ? selectedInstanceResult.execution_record.result_data
                          : JSON.stringify(selectedInstanceResult.execution_record.result_data, null, 2)}
                      </pre>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {selectedInstanceResult.execution_record.status === 'failed' && (
            <div className="space-y-3">
              {selectedInstanceResult.execution_record.error_message && (
                <div>
                  <div className="font-medium text-sm mb-1 text-red-700">错误信息:</div>
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                    {typeof selectedInstanceResult.execution_record.error_message === 'string'
                      ? selectedInstanceResult.execution_record.error_message
                      : JSON.stringify(selectedInstanceResult.execution_record.error_message, null, 2)}
                  </div>
                </div>
              )}

              {selectedInstanceResult.execution_record.result_message && (
                <div>
                  <div className="font-medium text-sm mb-1 text-red-700">失败详情:</div>
                  <div className="text-sm text-gray-700 bg-red-50 p-3 rounded border border-red-200">
                    {typeof selectedInstanceResult.execution_record.result_message === 'string'
                      ? selectedInstanceResult.execution_record.result_message
                      : JSON.stringify(selectedInstanceResult.execution_record.result_message, null, 2)}
                  </div>
                </div>
              )}

              {selectedInstanceResult.execution_record.result_data && (
                <div>
                  <div className="font-medium text-sm mb-1 text-red-700">错误数据:</div>
                  {(() => {
                    const isShellTask = selectedTaskType === 'shell_exec'
                    if (isShellTask && typeof selectedInstanceResult.execution_record.result_data === 'object') {
                      const resultObj = selectedInstanceResult.execution_record.result_data as any
                      if (resultObj.output !== undefined && resultObj.output !== null) {
                        return (
                          <pre className="text-sm font-mono text-gray-800 bg-red-50 p-3 rounded border border-red-200 whitespace-pre-wrap max-h-96 overflow-auto">
                            {typeof resultObj.output === 'string' ? resultObj.output : JSON.stringify(resultObj.output, null, 2)}
                          </pre>
                        )
                      }
                    }
                    return (
                      <pre className="text-sm font-mono text-gray-800 bg-red-50 p-3 rounded border border-red-200 whitespace-pre-wrap max-h-96 overflow-auto">
                        {typeof selectedInstanceResult.execution_record.result_data === 'string'
                          ? selectedInstanceResult.execution_record.result_data
                          : JSON.stringify(selectedInstanceResult.execution_record.result_data, null, 2)}
                      </pre>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {selectedInstanceResult.execution_record.status !== 'success' && selectedInstanceResult.execution_record.status !== 'failed' && (
            <div className="space-y-3">
              {selectedInstanceResult.execution_record.result_message && (
                <div>
                  <div className="font-medium text-sm mb-1">状态消息:</div>
                  <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                    {typeof selectedInstanceResult.execution_record.result_message === 'string'
                      ? selectedInstanceResult.execution_record.result_message
                      : JSON.stringify(selectedInstanceResult.execution_record.result_message, null, 2)}
                  </div>
                </div>
              )}

              {selectedInstanceResult.execution_record.error_message && (
                <div>
                  <div className="font-medium text-sm mb-1 text-orange-700">警告信息:</div>
                  <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">
                    {typeof selectedInstanceResult.execution_record.error_message === 'string'
                      ? selectedInstanceResult.execution_record.error_message
                      : JSON.stringify(selectedInstanceResult.execution_record.error_message, null, 2)}
                  </div>
                </div>
              )}

              {selectedInstanceResult.execution_record.result_data && (
                <div>
                  <div className="font-medium text-sm mb-1">当前数据:</div>
                  {(() => {
                    const isShellTask = selectedTaskType === 'shell_exec'
                    if (isShellTask && typeof selectedInstanceResult.execution_record.result_data === 'object') {
                      const resultObj = selectedInstanceResult.execution_record.result_data as any
                      if (resultObj.output !== undefined && resultObj.output !== null) {
                        return (
                          <pre className="text-sm font-mono text-gray-800 bg-white p-3 rounded border whitespace-pre-wrap max-h-96 overflow-auto">
                            {typeof resultObj.output === 'string' ? resultObj.output : JSON.stringify(resultObj.output, null, 2)}
                          </pre>
                        )
                      }
                    }
                    return (
                      <pre className="text-sm font-mono text-gray-800 bg-white p-3 rounded border whitespace-pre-wrap max-h-96 overflow-auto">
                        {typeof selectedInstanceResult.execution_record.result_data === 'string'
                          ? selectedInstanceResult.execution_record.result_data
                          : JSON.stringify(selectedInstanceResult.execution_record.result_data, null, 2)}
                      </pre>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}