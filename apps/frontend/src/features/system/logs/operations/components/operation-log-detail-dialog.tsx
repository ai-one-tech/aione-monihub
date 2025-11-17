import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CodeEditor } from '@/components/code-editor'
import { useQuery } from '@tanstack/react-query'
import { operationsLogsApi } from '../../operations/api/operations-api'

type Props = { id: string | null; open: boolean; onOpenChange: (open: boolean) => void }

export function OperationLogDetailDialog({ id, open, onOpenChange }: Props) {
  const { data } = useQuery({
    queryKey: ['operation-log-detail', id],
    enabled: !!id && open,
    queryFn: () => operationsLogsApi.getOperationLogDetail(id as string),
  })

  if (!id) return null

  const beforeStr = data?.before ? JSON.stringify(data.before, null, 2) : ''
  const afterStr = data?.after ? JSON.stringify(data.after, null, 2) : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>操作详情</DialogTitle>
          <DialogDescription>
            {data?.table} · {data?.operation} · {data?.timestamp}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className='max-h-[70vh] pr-4'>
          <div className='space-y-6'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-muted-foreground'>操作用户</span>
                <p className='mt-1 font-mono'>{data?.user}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>操作IP</span>
                <p className='mt-1 font-mono'>{data?.ip}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>TraceID</span>
                <p className='mt-1 font-mono'>{data?.trace_id || ''}</p>
              </div>
            </div>

            <Separator />

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <h3 className='text-sm font-semibold mb-2'>操作前数据</h3>
                <CodeEditor language='json' value={beforeStr} onChange={() => {}} minHeight={300} />
              </div>
              <div>
                <h3 className='text-sm font-semibold mb-2'>操作后数据</h3>
                <CodeEditor language='json' value={afterStr} onChange={() => {}} minHeight={300} />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className='text-sm font-semibold mb-2'>差异对比</h3>
              <div className='rounded-md border'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-muted'>
                      <th className='text-start p-2'>字段路径</th>
                      <th className='text-start p-2'>类型</th>
                      <th className='text-start p-2'>变更前</th>
                      <th className='text-start p-2'>变更后</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.diff || []).map((d, i) => (
                      <tr key={i} className='border-t'>
                        <td className='p-2 font-mono'>{d.path}</td>
                        <td className='p-2'>{d.type}</td>
                        <td className='p-2 font-mono'>
                          <pre className='max-h-32 overflow-auto'>{d.before ? JSON.stringify(d.before, null, 2) : ''}</pre>
                        </td>
                        <td className='p-2 font-mono'>
                          <pre className='max-h-32 overflow-auto'>{d.after ? JSON.stringify(d.after, null, 2) : ''}</pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}