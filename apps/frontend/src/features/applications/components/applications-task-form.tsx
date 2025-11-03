import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Command, Settings2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { TaskCreateRequest } from '../data/api-schema'
import {
  TASK_TYPES,
  TASK_TYPE_CONFIGS,
  executeCommandSchema,
  restartServiceSchema,
  collectLogsSchema,
  updateConfigSchema,
  fileTransferSchema,
} from '../data/task-types'

const baseTaskSchema = z.object({
  task_name: z.string().min(1, '任务名称不能为空'),
  task_type: z.string().min(1, '请选择任务类型'),
  priority: z.number().min(1).max(10).optional(),
  timeout_seconds: z.number().min(1).max(3600).optional(),
  retry_count: z.number().min(0).max(5).optional(),
})

interface ApplicationTaskFormProps {
  onSubmit: (data: Partial<TaskCreateRequest>) => void
  onCancel: () => void
  selectedInstancesCount: number
}

export function ApplicationTaskForm({
  onSubmit,
  onCancel,
  selectedInstancesCount,
}: ApplicationTaskFormProps) {
  const [selectedTaskType, setSelectedTaskType] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const form = useForm({
    resolver: zodResolver(baseTaskSchema),
    defaultValues: {
      task_name: '',
      task_type: '',
      priority: 5,
      timeout_seconds: 300,
      retry_count: 0,
    },
  })

  const handleTaskTypeChange = (value: string) => {
    setSelectedTaskType(value)
    form.setValue('task_type', value)
  }

  const handleFormSubmit = (baseData: z.infer<typeof baseTaskSchema>) => {
    const taskContentFormData = getTaskContentFormData()
    
    if (!taskContentFormData) {
      return
    }

    const taskData: Partial<TaskCreateRequest> = {
      task_name: baseData.task_name,
      task_type: baseData.task_type,
      task_content: taskContentFormData,
      priority: baseData.priority,
      timeout_seconds: baseData.timeout_seconds,
      retry_count: baseData.retry_count,
    }

    onSubmit(taskData)
  }

  const getTaskContentFormData = (): Record<string, unknown> | null => {
    const formElement = document.getElementById('task-content-form') as HTMLFormElement
    if (!formElement) return null

    const formData = new FormData(formElement)
    const data: Record<string, unknown> = {}

    formData.forEach((value, key) => {
      if (key.includes('.')) {
        // Handle nested objects like env.KEY
        const [parent, child] = key.split('.')
        if (!data[parent]) {
          data[parent] = {}
        }
        ;(data[parent] as Record<string, unknown>)[child] = value
      } else {
        data[key] = value
      }
    })

    // Validate based on task type
    try {
      switch (selectedTaskType) {
        case TASK_TYPES.EXECUTE_COMMAND:
          return executeCommandSchema.parse(data)
        case TASK_TYPES.RESTART_SERVICE:
          return restartServiceSchema.parse(data)
        case TASK_TYPES.COLLECT_LOGS:
          return collectLogsSchema.parse(data)
        case TASK_TYPES.UPDATE_CONFIG:
          return updateConfigSchema.parse(data)
        case TASK_TYPES.FILE_TRANSFER:
          return fileTransferSchema.parse(data)
        default:
          return null
      }
    } catch (error) {
      console.error('Task content validation failed:', error)
      return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Command className="h-4 w-4" />
          <span>将向 {selectedInstancesCount} 个实例下发任务</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col flex-1">
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {/* Task Name */}
            <FormField
              control={form.control}
              name="task_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>任务名称</FormLabel>
                  <FormControl>
                    <Input placeholder="输入任务名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Task Type */}
            <FormField
              control={form.control}
              name="task_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>任务类型</FormLabel>
                  <Select onValueChange={handleTaskTypeChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择任务类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TASK_TYPE_CONFIGS).map((config) => (
                        <SelectItem key={config.value} value={config.value}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Task Content Form */}
            {selectedTaskType && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="text-sm font-medium mb-3">任务参数</h4>
                <TaskContentForm taskType={selectedTaskType} />
              </div>
            )}

            {/* Advanced Options */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    <span>高级选项</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>优先级 (1-10)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>数字越大优先级越高，默认为 5</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeout_seconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>超时时间 (秒)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={3600}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>任务执行超时时间，默认 300 秒</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retry_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>重试次数</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>失败后的重试次数，默认 0</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit" disabled={!selectedTaskType}>
              下发任务
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

interface TaskContentFormProps {
  taskType: string
}

function TaskContentForm({ taskType }: TaskContentFormProps) {
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([])

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }])
  }

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index))
  }

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars]
    newEnvVars[index][field] = value
    setEnvVars(newEnvVars)
  }

  return (
    <form id="task-content-form" className="space-y-4">
      {taskType === TASK_TYPES.EXECUTE_COMMAND && (
        <>
          <div className="space-y-2">
            <Label htmlFor="command">命令 *</Label>
            <Textarea
              id="command"
              name="command"
              placeholder="输入要执行的命令"
              className="font-mono text-sm"
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workdir">工作目录</Label>
            <Input id="workdir" name="workdir" placeholder="/path/to/workdir" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>环境变量</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEnvVar}>
                添加
              </Button>
            </div>
            {envVars.map((envVar, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="KEY"
                  value={envVar.key}
                  onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                  name={`env.${envVar.key || `key${index}`}`}
                />
                <Input
                  placeholder="VALUE"
                  value={envVar.value}
                  onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEnvVar(index)}
                >
                  删除
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {taskType === TASK_TYPES.RESTART_SERVICE && (
        <>
          <div className="space-y-2">
            <Label htmlFor="service_name">服务名称 *</Label>
            <Input id="service_name" name="service_name" placeholder="服务名称" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restart_mode">重启模式</Label>
            <Select name="restart_mode" defaultValue="graceful">
              <SelectTrigger id="restart_mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="graceful">优雅重启</SelectItem>
                <SelectItem value="force">强制重启</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {taskType === TASK_TYPES.COLLECT_LOGS && (
        <>
          <div className="space-y-2">
            <Label htmlFor="log_path">日志路径 *</Label>
            <Input
              id="log_path"
              name="log_path"
              placeholder="/var/log/app.log"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">开始时间</Label>
              <Input id="start_time" name="start_time" type="datetime-local" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">结束时间</Label>
              <Input id="end_time" name="end_time" type="datetime-local" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_lines">最大行数</Label>
            <Input
              id="max_lines"
              name="max_lines"
              type="number"
              placeholder="1000"
              defaultValue={1000}
            />
          </div>
        </>
      )}

      {taskType === TASK_TYPES.UPDATE_CONFIG && (
        <>
          <div className="space-y-2">
            <Label htmlFor="config_path">配置文件路径 *</Label>
            <Input
              id="config_path"
              name="config_path"
              placeholder="/etc/app/config.yml"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="config_content">配置内容 *</Label>
            <Textarea
              id="config_content"
              name="config_content"
              placeholder="配置文件内容"
              rows={8}
              className="font-mono text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backup">备份原文件</Label>
            <Select name="backup" defaultValue="true">
              <SelectTrigger id="backup">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">是</SelectItem>
                <SelectItem value="false">否</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {taskType === TASK_TYPES.FILE_TRANSFER && (
        <>
          <div className="space-y-2">
            <Label htmlFor="source_path">源文件路径 *</Label>
            <Input
              id="source_path"
              name="source_path"
              placeholder="/local/path/file.tar.gz"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_path">目标路径 *</Label>
            <Input
              id="target_path"
              name="target_path"
              placeholder="/remote/path/"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer_mode">传输模式</Label>
            <Select name="transfer_mode" defaultValue="upload">
              <SelectTrigger id="transfer_mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upload">上传</SelectItem>
                <SelectItem value="download">下载</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </form>
  )
}
