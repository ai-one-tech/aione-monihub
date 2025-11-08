import { useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { type ApplicationResponse } from '../data/api-schema'
import { ApplicationTaskForm } from './applications-task-form'
import { ApplicationTaskResultList } from './applications-task-result-list'
import { useApplicationInstances } from '../hooks/use-application-instances'
import { useCreateTask } from '../hooks/use-application-tasks'
import { type TaskCreateRequest } from '../data/api-schema'
import { ArrowLeft } from 'lucide-react'

interface ApplicationTaskDrawerProps {
  application: ApplicationResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'configure' | 'result'

export function ApplicationTaskDrawer({ application, open, onOpenChange }: ApplicationTaskDrawerProps) {
  const [currentStep, setCurrentStep] = useState<Step>('configure')
  const [taskData, setTaskData] = useState<Partial<TaskCreateRequest> | null>(null)
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null)

  const { data: instancesData } = useApplicationInstances(application?.id || '')
  const createTaskMutation = useCreateTask()

  const instances = instancesData?.data || []
  const activeInstances = instances.filter((i) => i.status === 'active')
  const inactiveInstances = instances.filter((i) => i.status !== 'active')

  const handleClose = () => {
    onOpenChange(false)
    // 延迟重置状态，避免关闭动画期间看到状态变化
    setTimeout(() => {
      setCurrentStep('configure')
      setTaskData(null)
      setCreatedTaskId(null)
    }, 300)
  }

  const handleBack = () => {
    if (currentStep === 'result') {
      setCurrentStep('configure')
    }
  }

  const handleSubmitTask = async (data: Partial<TaskCreateRequest>) => {
    // 自动选择所有在线实例
    const targetInstances = activeInstances.map((i) => i.id)
    if (!targetInstances.length) return

    const request: TaskCreateRequest = {
      task_name: data.task_name!,
      task_type: data.task_type!,
      target_instances: targetInstances,
      task_content: data.task_content!,
      priority: data.priority,
      timeout_seconds: data.timeout_seconds,
      retry_count: data.retry_count,
    }

    setTaskData(request)

    try {
      const result = await createTaskMutation.mutateAsync(request)
      setCreatedTaskId(result.id)
      setCurrentStep('result')
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side='right'
        className='w-[80vw] max-w-[80vw] flex flex-col'
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>创建实例任务 - {application?.name}</SheetTitle>
          <SheetDescription>
            系统将自动选择所有在线实例进行任务下发
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 min-h-0 mt-6 flex flex-col gap-6'>
          {currentStep !== 'result' && (
            <div>
              <div className='mb-2 flex items-center justify-between'>
                <h3 className='text-sm font-medium'>在线实例</h3>
                <Badge variant='secondary'>在线 {activeInstances.length}</Badge>
              </div>
              <ScrollArea className='h-32 rounded-lg border p-2'>
                <div className='grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2'>
                  {activeInstances.map((inst) => (
                    <div
                      key={inst.id}
                      className='text-left rounded-md border px-3 py-2'
                    >
                      <div className='text-xs font-medium truncate'>{inst.name}</div>
                      <div className='text-[10px] text-muted-foreground truncate'>{inst.hostname}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {currentStep === 'configure' && (
            <div className='flex-1 min-h-0 overflow-auto'>
              <ApplicationTaskForm
                onSubmit={handleSubmitTask}
                onCancel={handleBack}
                selectedInstancesCount={activeInstances.length}
              />
              <Card className='mt-4 p-4'>
                <div className='text-sm font-medium'>将下发到以下实例</div>
                <ScrollArea className='mt-3 max-h-48 rounded-md border p-2'>
                  <div className='grid grid-cols-2 gap-2'>
                    {activeInstances.map((inst) => (
                      <div key={inst.id} className='rounded border px-3 py-2'>
                        <div className='text-xs font-medium truncate'>{inst.name}</div>
                        <div className='text-[10px] text-muted-foreground truncate'>{inst.hostname}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          )}

          {currentStep === 'result' && (
            <div className='flex h-full flex-col'>
              <Card className='p-4'>
                <div className='text-sm text-muted-foreground'>任务ID</div>
                <div className='mt-1 font-mono text-sm'>{createdTaskId}</div>
                <div className='mt-4'>
                  <Button variant='outline' onClick={handleBack}>
                    <ArrowLeft className='mr-2 h-4 w-4' /> 返回配置
                  </Button>
                </div>
              </Card>
              {createdTaskId && (
                <div className='mt-4 flex-1 min-h-0'>
                  <ApplicationTaskResultList taskId={createdTaskId} onViewDetails={() => {}} />
                </div>
              )}
              <div className='mt-4 flex justify-end border-t pt-4'>
                <Button onClick={handleClose}>完成</Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
