import { useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type ApplicationResponse } from '../data/api-schema'
import { ApplicationInstanceSelector } from './applications-instance-selector'
import { ApplicationTaskForm } from './applications-task-form'
import { ApplicationTaskResultList } from './applications-task-result-list'
import { ApplicationTaskResultDialog } from './applications-task-result-dialog'
import { useApplicationInstances } from '../hooks/use-application-instances'
import { useCreateTask, useRetryTaskRecord } from '../hooks/use-application-tasks'
import { type TaskCreateRequest } from '../data/api-schema'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface ApplicationTaskDrawerProps {
  application: ApplicationResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'select' | 'configure' | 'result'

export function ApplicationTaskDrawer({ application, open, onOpenChange }: ApplicationTaskDrawerProps) {
  const [currentStep, setCurrentStep] = useState<Step>('select')
  const [selectedInstances, setSelectedInstances] = useState<string[]>([])
  const [taskData, setTaskData] = useState<Partial<TaskCreateRequest> | null>(null)
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null)

  const { data: instancesData } = useApplicationInstances(application?.id || '')
  const createTaskMutation = useCreateTask()

  const handleClose = () => {
    onOpenChange(false)
    // 延迟重置状态，避免关闭动画期间看到状态变化
    setTimeout(() => {
      setCurrentStep('select')
      setSelectedInstances([])
      setTaskData(null)
      setCreatedTaskId(null)
    }, 300)
  }

  const handleNext = () => {
    if (currentStep === 'select') {
      setCurrentStep('configure')
    }
  }

  const handleBack = () => {
    if (currentStep === 'configure') {
      setCurrentStep('select')
    } else if (currentStep === 'result') {
      setCurrentStep('configure')
    }
  }

  const handleSubmitTask = async (data: Partial<TaskCreateRequest>) => {
    if (!selectedInstances.length) return

    const request: TaskCreateRequest = {
      task_name: data.task_name!,
      task_type: data.task_type!,
      target_instances: selectedInstances,
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

  const canProceed = currentStep === 'select' && selectedInstances.length > 0

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side='right' className='sm:max-w-4xl w-full flex flex-col'>
        <SheetHeader>
          <SheetTitle>任务下发 - {application?.name}</SheetTitle>
          <SheetDescription>
            选择实例并配置任务参数，然后下发任务到目标实例
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 min-h-0 mt-6'>
          {currentStep === 'select' && (
            <div className='h-full flex flex-col'>
              <div className='flex-1 min-h-0'>
                <ApplicationInstanceSelector
                  instances={instancesData?.data || []}
                  selectedIds={selectedInstances}
                  onSelectionChange={setSelectedInstances}
                />
              </div>
              <div className='flex justify-between pt-4 border-t mt-4'>
                <div className='text-sm text-muted-foreground'>
                  已选择 {selectedInstances.length} 个实例
                </div>
                <Button onClick={handleNext} disabled={!canProceed}>
                  下一步：配置任务
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'configure' && (
            <div className='h-full flex flex-col'>
              <div className='flex-1 min-h-0 overflow-auto'>
                <ApplicationTaskForm
                  onSubmit={handleSubmitTask}
                  onCancel={handleBack}
                  selectedInstancesCount={selectedInstances.length}
                />
              </div>
            </div>
          )}

          {currentStep === 'result' && createdTaskId && (
            <div className='h-full flex flex-col'>
              <div className='flex-1 min-h-0'>
                <ApplicationTaskResultList
                  taskId={createdTaskId}
                  onViewDetails={() => {}}
                />
              </div>
              <div className='flex justify-end pt-4 border-t mt-4'>
                <Button onClick={handleClose}>完成</Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
