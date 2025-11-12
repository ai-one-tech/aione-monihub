import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { LongText } from '@/components/long-text'
import { Label } from '@/components/ui/label'
import { ChevronRight, CheckCircle, RefreshCw, Copy } from 'lucide-react'
import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { applicationsApi } from '@/features/applications/api/applications-api'
import { useApplicationInstances } from '@/features/applications/hooks/use-application-instances'

const route = getRouteApi('/_authenticated/application-tasks')

export function ApplicationTasks() {
  const search = route.useSearch()
  const queryClient = useQueryClient()
  const [selectedInstances, setSelectedInstances] = useState<string[]>([])
  const [taskType, setTaskType] = useState('shell_exec')
  
  // 不同任务类型的参数状态
  const [shellScript, setShellScript] = useState('')
  const [codeContent, setCodeContent] = useState('')
  const [fileManagerOperation, setFileManagerOperation] = useState('list')
  const [filePath, setFilePath] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [customCommand, setCustomCommand] = useState('')

  // 获取应用详情
  const { data: application } = useQuery({
    queryKey: ['application', search.applicationId],
    queryFn: () => applicationsApi.getApplicationById(search.applicationId!),
    enabled: !!search.applicationId,
  })

  // 获取应用下的实例列表
  const { data: instancesData } = useApplicationInstances(search.applicationId || '')

  // 获取任务列表
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', search.applicationId],
    queryFn: () => applicationsApi.getTasks({
      application_id: search.applicationId,
      limit: 20
    }),
  })

  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [taskInstances, setTaskInstances] = useState<any[]>([])
  const [selectedInstanceResult, setSelectedInstanceResult] = useState<any>(null)

  const instances = instancesData?.data || []
  const tasks = tasksData?.data || []

  // 拷贝到剪贴板功能
  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('已复制到剪贴板')
    } catch (err) {
      toast.error('复制失败')
    }
  }

  // 任务类型中文映射
  const getTaskTypeLabel = (taskType: string) => {
    const typeMap: Record<string, string> = {
      'shell_exec': '执行Shell',
      'run_code': '运行Code',
      'file_manager': '文件管理',
      'custom_command': '自定义命令'
    }
    return typeMap[taskType] || taskType
  }

  // 执行状态中文映射
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'dispatched': '已分发',
      'success': '成功',
      'failed': '失败',
      'running': '运行中',
      'pending': '等待中',
      'cancelled': '已取消',
      'timeout': '超时'
    }
    return statusMap[status] || status
  }

  // 渲染不同任务类型的参数输入表单
  const renderTaskTypeForm = () => {
    switch (taskType) {
      case 'shell_exec':
        return (
          <div>
            <Textarea
              placeholder="请输入Shell脚本"
              value={shellScript}
              onChange={(e) => setShellScript(e.target.value)}
              rows={2}
            />
          </div>
        )
      
      case 'run_code':
        return (
          <div className="space-y-3">
              <Textarea
                placeholder="请输入要执行的代码"
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                rows={2}
              />
          </div>
        )
      
      case 'file_manager':
        return (
          <div className="space-y-3">
            <div>
              <select 
                value={fileManagerOperation} 
                onChange={(e) => setFileManagerOperation(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="list">上传文件</option>
                <option value="read">下载文件</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                placeholder="请输入文件路径，如：/tmp/test.txt"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background text-sm"
              />
            </div>
          </div>
        )
      
      case 'custom_command':
        return (
          <div>
            <Textarea
              placeholder="请输入自定义命令"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              rows={3}
            />
          </div>
        )
      
      default:
        return null
    }
  }

  // 获取任务关联的实例和执行结果
  const { data: taskInstancesData } = useQuery({
    queryKey: ['task-instances', selectedTask],
    queryFn: () => selectedTask ? applicationsApi.getTaskInstancesWithResults(selectedTask) : Promise.resolve(null),
    enabled: !!selectedTask,
  })

  const handleInstanceSelect = (instanceId: string) => {
    setSelectedInstances(prev =>
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    )
  }

  const handleSelectAll = () => {
    if (selectedInstances.length === instances.length) {
      setSelectedInstances([])
    } else {
      setSelectedInstances(instances.map(instance => instance.id))
    }
  }

  const handleSubmitTask = async () => {
    // 根据任务类型验证必需的参数
    let isValid = false
    let taskContent: any = {
      workdir: null,
      env: null,
    }

    switch (taskType) {
      case 'shell_exec':
        isValid = shellScript.trim() !== ''
        taskContent.script = shellScript
        break
      
      case 'run_code':
        isValid = codeContent.trim() !== ''
        taskContent.code = codeContent
        break
      
      case 'file_manager':
        isValid = filePath.trim() !== ''
        taskContent.operation = fileManagerOperation
        taskContent.path = filePath
        break
      
      case 'custom_command':
        isValid = customCommand.trim() !== ''
        taskContent.command = customCommand
        break
    }

    if (!isValid || selectedInstances.length === 0) {
      toast.error('请填写必要的参数并选择至少一个实例')
      return
    }

    try {
      const taskData = {
        application_id: search.applicationId,
        task_name: `${getTaskTypeLabel(taskType)}-${Date.now().toString().substring(0, 10)}`,
        task_type: taskType,
        target_instances: selectedInstances,
        task_content: taskContent,
        priority: 5,
        timeout_seconds: 300,
        retry_count: 1,
      }

      // 创建任务
      const newTask = await applicationsApi.createTask(taskData)
      
      // 显示成功提示
      toast.success('任务创建成功！')
      
      // 清空表单
      setShellScript('')
      setCodeContent('')
      setFilePath('')
      setFileContent('')
      setCustomCommand('')
      setSelectedInstances([])

      // 刷新任务列表和实例数据
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks', search.applicationId] }),
        queryClient.invalidateQueries({ queryKey: ['application-instances', search.applicationId] })
      ])

      // 延迟一下再选中新任务，确保数据已刷新
      setTimeout(() => {
        if (newTask?.id) {
          setSelectedTask(newTask.id)
        }
      }, 100)
      
    } catch (error) {
      console.error('创建任务失败:', error)
      toast.error('任务创建失败，请重试')
    }
  }

  // 处理任务选择
  const handleTaskSelect = async (taskId: string) => {
    setSelectedTask(taskId)
    setSelectedInstanceResult(null)
  }

  // 处理实例选择
  const handleInstanceResultSelect = (instanceData: any) => {
    setSelectedInstanceResult(instanceData)
  }

  // 更新taskInstances数据
  React.useEffect(() => {
    if (taskInstancesData?.data) {
      setTaskInstances(taskInstancesData.data)
      
      // 如果有任务实例数据且还没有选中的实例结果，则自动选中第一个
      if (taskInstancesData.data.length > 0 && !selectedInstanceResult) {
        handleInstanceResultSelect(taskInstancesData.data[0])
      }
    }
  }, [taskInstancesData, selectedInstanceResult])

  return (
    <Main fixed className="flex lex-col h-[calc(100vh-50rem)] overflow-auto">
      <div className="flex flex-col flex-1 min-h-0 overflow-auto">
        {/* 页面标题区域 */}
        <div className="shrink-0 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight">
              应用：{application?.name}
              <span className="text-sm pl-2 text-gray-500">ID：{application?.id}</span>
            </h2>
          </div>

          <div className="flex gap-4 h-[250px] min-h-0 overflow-auto">
            {/* 在线实例 */}
            <Card className="flex-1 p-4 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <div className='flex items-center'>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedInstances.length === instances.length ? '取消全选' : '全选'}
                  </Button>
                  <h3 className="text-lg font-semibold ml-2">在线实例</h3>
                </div>
                <Badge variant="secondary">在线 {instances.length}</Badge>
              </div>

              <ScrollArea className="rounded-lg flex-1">
                <div className="grid grid-cols-2 gap-2">
                  {instances.map((instance) => (
                    <div
                      key={instance.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedInstances.includes(instance.id)
                          ? 'bg-gray-50 border-gray-200 dark:bg-accent dark:border-gray-700'
                          : 'hover:bg-gray-50 dark:hover:bg-accent'
                        }`}
                      onClick={() => handleInstanceSelect(instance.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedInstances.includes(instance.id)
                            ? 'bg-gray-600 border-gray-600 dark:bg-gray-400 dark:border-gray-400'
                            : 'border-gray-300 dark:border-gray-600'
                          }`}>
                          {selectedInstances.includes(instance.id) && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {instance.id}
                          </div>
                          <div className="flex justify-between items-center w-full">
                            <p className="text-xs text-gray-600 truncate">
                              {instance.hostname || '未知主机名'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {instance.public_ip || instance.ip_address || '未知IP'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* 创建任务 */}
            <Card className="flex-1 p-4 flex flex-col min-h-0">
              <h3 className="text-lg font-semibold mb-4">创建任务</h3>

              <div className="space-y-4">
                <div>
                  <RadioGroup value={taskType} onValueChange={setTaskType} className="flex flex-row gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="shell_exec" id="shell_exec" />
                      <Label htmlFor="shell_exec" className="text-sm">执行Shell</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="run_code" id="run_code" />
                      <Label htmlFor="run_code" className="text-sm">运行Code</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="file_manager" id="file_manager" />
                      <Label htmlFor="file_manager" className="text-sm">文件管理</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom_command" id="custom_command" />
                      <Label htmlFor="custom_command" className="text-sm">自定义命令</Label>
                    </div>
                  </RadioGroup>
                </div>

                {renderTaskTypeForm()}

                <Button
                  className="w-full"
                  onClick={handleSubmitTask}
                >
                  发起任务
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* 底部三个区域 */}
        <div className="flex-1 p-4 pt-0 overflow-auto flex flex-col min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full min-h-0">
            {/* 任务历史 */}
            <Card className="p-4 flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold">任务历史</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks', search.applicationId] })}
                  disabled={!search.applicationId}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新
                </Button>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTask === task.id 
                          ? 'bg-gray-50 border-gray-200 dark:bg-accent dark:border-gray-700' 
                          : 'hover:bg-gray-50 dark:hover:bg-accent'
                      }`}
                      onClick={() => handleTaskSelect(task.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getTaskTypeLabel(task.task_type)}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-green-600 font-medium">
                          {task.target_instances?.length || 0}&nbsp;个实例
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <LongText className="text-sm w-1/2 text-gray-700 mb-1">{task.task_name}</LongText>
                        <span>
                          {new Date(task.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* 相关实例 */}
            <Card className="p-4 flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold">相关实例</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['task-instances', selectedTask] })}
                  disabled={!selectedTask}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新
                </Button>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-3">
                  {taskInstances.map((taskInstance) => (
                    <div 
                      key={taskInstance.instance.id} 
                      className={`relative p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedInstanceResult?.instance.id === taskInstance.instance.id
                          ? 'bg-gray-50 border-gray-200 dark:bg-accent dark:border-gray-700'
                          : 'hover:bg-gray-50 dark:hover:bg-accent'
                      }`}
                      onClick={() => handleInstanceResultSelect(taskInstance)}
                    >
                      {/* 右上角在线状态 */}
                      <div className="absolute top-2 right-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            taskInstance.instance.online_status === 'online' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}
                        >
                          {taskInstance.instance.online_status === 'online' ? '在线' : '离线'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm font-medium truncate mb-1 pr-16">
                        {taskInstance.instance.id}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-600 truncate flex-1 mr-2">
                          {taskInstance.instance.hostname || '未知主机名'}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-[120px]">
                          {taskInstance.instance.public_ip || taskInstance.instance.ip_address || '未知IP'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              taskInstance.execution_record.status === 'success' 
                                ? 'text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950'
                                : taskInstance.execution_record.status === 'failed'
                                ? 'text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950'
                                : taskInstance.execution_record.status === 'running'
                                ? 'text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950'
                                : taskInstance.execution_record.status === 'dispatched'
                                ? 'text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950'
                                : taskInstance.execution_record.status === 'timeout'
                                ? 'text-purple-600 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950'
                                : taskInstance.execution_record.status === 'cancelled'
                                ? 'text-gray-600 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:bg-gray-800'
                                : 'text-gray-600 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:bg-gray-800'
                            }`}
                          >
                            {getStatusLabel(taskInstance.execution_record.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {taskInstance.execution_record.start_time 
                              ? new Date(taskInstance.execution_record.start_time).toLocaleString()
                              : taskInstance.instance.updated_at 
                                ? new Date(taskInstance.instance.updated_at).toLocaleString()
                                : '未开始'
                            }
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* 执行结果 */}
            <Card className="p-4 flex flex-col h-full min-h-0">
              <h3 className="text-lg font-semibold mb-4 shrink-0">执行结果</h3>
              <div className="flex-1 rounded-lg border bg-gray-50 dark:bg-accent p-4 overflow-auto min-h-0">
                {selectedInstanceResult ? (
                  <div className="space-y-4">
                    {/* 基础信息 */}
                    <div className="grid grid-cols-2 gap-4 text-sm"> 
                      
                      {/* 执行时长 */}
                      {selectedInstanceResult.execution_record.duration_ms && (
                        <div>
                          <span className="font-medium">执行时长:</span>
                          <div className="text-gray-600">
                            {(selectedInstanceResult.execution_record.duration_ms / 1000).toFixed(2)}秒
                          </div>
                        </div>
                      )}
                      
                      {/* 结束时间 */}
                      {selectedInstanceResult.execution_record.end_time && (
                        <div>
                          <span className="font-medium">结束时间:</span>
                          <div className="text-gray-600">
                            {new Date(selectedInstanceResult.execution_record.end_time).toLocaleString()}
                          </div>
                        </div>
                      )}
                                          
                    </div>
                    
                    {/* 根据状态显示不同内容 */}
                    {selectedInstanceResult.execution_record.status === 'success' && (
                      <div>
                        
                        {/* 成功状态的结果消息 */}
                        {selectedInstanceResult.execution_record.result_message && (
                          <div>
                            <div className="font-medium text-sm mb-1 text-green-700">执行结果:</div>
                            <div className="text-sm text-gray-700 bg-green-50 p-3 rounded border border-green-200">
                              {typeof selectedInstanceResult.execution_record.result_message === 'string' 
                                ? selectedInstanceResult.execution_record.result_message
                                : JSON.stringify(selectedInstanceResult.execution_record.result_message, null, 2)
                              }
                            </div>
                          </div>
                        )}
                        
                        {/* 成功状态的结果数据 */}
                        {selectedInstanceResult.execution_record.result_data && (
                          <div className='flex-1'>
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-sm text-primary">输出数据:</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-200"
                                onClick={() => {
                                  const content = (() => {
                                    const currentTask = tasksData?.data?.find(t => t.id === selectedTask);
                                    const isShellTask = currentTask?.task_type === 'shell_exec';
                                    
                                    if (isShellTask && typeof selectedInstanceResult.execution_record.result_data === 'object') {
                                      const resultObj = selectedInstanceResult.execution_record.result_data as any;
                                      if (resultObj.output) {
                                        return resultObj.output;
                                      }
                                    }
                                    
                                    return typeof selectedInstanceResult.execution_record.result_data === 'string' 
                                      ? selectedInstanceResult.execution_record.result_data
                                      : JSON.stringify(selectedInstanceResult.execution_record.result_data, null, 2);
                                  })();
                                  copyToClipboard(content);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            {(() => {
                              // 获取当前任务信息
                              const currentTask = tasksData?.data?.find(t => t.id === selectedTask);
                              const isShellTask = ['shell_exec', 'run_code'].includes(currentTask?.task_type || '');
                              
                              // 如果是shell任务且result_data是包含output的JSON对象
                              if (isShellTask && typeof selectedInstanceResult.execution_record.result_data === 'object') {
                                const resultObj = selectedInstanceResult.execution_record.result_data as any;
                                if (resultObj.output) {
                                  return (
                                    <pre className="text-sm font-mono text-white bg-gray-800 p-3 rounded border border-green-200 dark:text-gray-800 dark:bg-white dark:border-green-800 whitespace-pre-wrap">
                                      {typeof resultObj.output === 'string' 
                                        ? resultObj.output
                                        : JSON.stringify(resultObj.output, null, 2)
                                      }
                                    </pre>
                                  );
                                }
                              }
                              
                              // 默认显示
                              return (
                                <pre className="text-sm font-mono text-white bg-gray-800 p-3 rounded border border-green-200 dark:text-gray-800 dark:bg-white dark:border-green-800 whitespace-pre-wrap">
                                  {typeof selectedInstanceResult.execution_record.result_data === 'string' 
                                    ? selectedInstanceResult.execution_record.result_data
                                    : JSON.stringify(selectedInstanceResult.execution_record.result_data, null, 2)
                                  }
                                </pre>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedInstanceResult.execution_record.status === 'failed' && (
                      <div className="space-y-3">
                      {/* 重试次数 */}
                      {selectedInstanceResult.execution_record.retry_attempt !== undefined && selectedInstanceResult.execution_record.retry_attempt !== null && (
                        <div>
                          <span className="font-medium">重试次数:</span>
                          <div className="text-gray-600">{selectedInstanceResult.execution_record.retry_attempt}</div>
                        </div>
                      )}

                        
                        {/* 失败状态的错误消息 */}
                        {selectedInstanceResult.execution_record.error_message && (
                          <div>
                            <div className="font-medium text-sm mb-1 text-red-700">错误信息:</div>
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                              {typeof selectedInstanceResult.execution_record.error_message === 'string' 
                                ? selectedInstanceResult.execution_record.error_message
                                : JSON.stringify(selectedInstanceResult.execution_record.error_message, null, 2)
                              }
                            </div>
                          </div>
                        )}
                        
                        {/* 失败状态的结果消息 */}
                        {selectedInstanceResult.execution_record.result_message && (
                          <div>
                            <div className="font-medium text-sm mb-1 text-red-700">失败详情:</div>
                            <div className="text-sm text-gray-700 bg-red-50 p-3 rounded border border-red-200">
                              {typeof selectedInstanceResult.execution_record.result_message === 'string' 
                                ? selectedInstanceResult.execution_record.result_message
                                : JSON.stringify(selectedInstanceResult.execution_record.result_message, null, 2)
                              }
                            </div>
                          </div>
                        )}
                        
                        {/* 失败状态的结果数据 */}
                        {selectedInstanceResult.execution_record.result_data && (
                          <div>
                            <div className="font-medium text-sm mb-1 text-red-700">错误数据:</div>
                            {(() => {
                              // 获取当前任务信息
                              const currentTask = tasksData?.data?.find(t => t.id === selectedTask);
                              const isShellTask = currentTask?.task_type === 'shell_exec';
                              
                              // 如果是shell任务且result_data是包含output的JSON对象
                              if (isShellTask && typeof selectedInstanceResult.execution_record.result_data === 'object') {
                                const resultObj = selectedInstanceResult.execution_record.result_data as any;
                                if (resultObj.output) {
                                  return (
                                    <pre className="text-sm font-mono text-gray-800 bg-red-50 p-3 rounded border border-red-200 whitespace-pre-wrap max-h-96 overflow-auto">
                                      {typeof resultObj.output === 'string' 
                                        ? resultObj.output
                                        : JSON.stringify(resultObj.output, null, 2)
                                      }
                                    </pre>
                                  );
                                }
                              }
                              
                              // 默认显示
                              return (
                                <pre className="text-sm font-mono text-gray-800 bg-red-50 p-3 rounded border border-red-200 whitespace-pre-wrap max-h-96 overflow-auto">
                                  {typeof selectedInstanceResult.execution_record.result_data === 'string' 
                                    ? selectedInstanceResult.execution_record.result_data
                                    : JSON.stringify(selectedInstanceResult.execution_record.result_data, null, 2)
                                  }
                                </pre>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 其他状态（运行中、已分发等）的显示 */}
                    {selectedInstanceResult.execution_record.status !== 'success' && selectedInstanceResult.execution_record.status !== 'failed' && (
                      <div className="space-y-3">

                        
                        {/* 结果消息 */}
                        {selectedInstanceResult.execution_record.result_message && (
                          <div>
                            <div className="font-medium text-sm mb-1">状态消息:</div>
                            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                              {typeof selectedInstanceResult.execution_record.result_message === 'string' 
                                ? selectedInstanceResult.execution_record.result_message
                                : JSON.stringify(selectedInstanceResult.execution_record.result_message, null, 2)
                              }
                            </div>
                          </div>
                        )}
                        
                        {/* 错误消息（如果有的话） */}
                        {selectedInstanceResult.execution_record.error_message && (
                          <div>
                            <div className="font-medium text-sm mb-1 text-orange-700">警告信息:</div>
                            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">
                              {typeof selectedInstanceResult.execution_record.error_message === 'string' 
                                ? selectedInstanceResult.execution_record.error_message
                                : JSON.stringify(selectedInstanceResult.execution_record.error_message, null, 2)
                              }
                            </div>
                          </div>
                        )}
                        
                        {/* 结果数据 */}
                        {selectedInstanceResult.execution_record.result_data && (
                          <div>
                            <div className="font-medium text-sm mb-1">当前数据:</div>
                            {(() => {
                              // 获取当前任务信息
                              const currentTask = tasksData?.data?.find(t => t.id === selectedTask);
                              const isShellTask = currentTask?.task_type === 'shell_exec';
                              
                              // 如果是shell任务且result_data是包含output的JSON对象
                              if (isShellTask && typeof selectedInstanceResult.execution_record.result_data === 'object') {
                                const resultObj = selectedInstanceResult.execution_record.result_data as any;
                                if (resultObj.output) {
                                  return (
                                    <pre className="text-sm font-mono text-gray-800 bg-white p-3 rounded border whitespace-pre-wrap max-h-96 overflow-auto">
                                      {typeof resultObj.output === 'string' 
                                        ? resultObj.output
                                        : JSON.stringify(resultObj.output, null, 2)
                                      }
                                    </pre>
                                  );
                                }
                              }
                              
                              // 默认显示
                              return (
                                <pre className="text-sm font-mono text-gray-800 bg-white p-3 rounded border whitespace-pre-wrap max-h-96 overflow-auto">
                                  {typeof selectedInstanceResult.execution_record.result_data === 'string' 
                                    ? selectedInstanceResult.execution_record.result_data
                                    : JSON.stringify(selectedInstanceResult.execution_record.result_data, null, 2)
                                  }
                                </pre>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>请先选择一个任务，然后选择实例查看执行结果</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Main>
  )
}