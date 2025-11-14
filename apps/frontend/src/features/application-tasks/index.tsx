import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { LongText } from '@/components/long-text'
import { Label } from '@/components/ui/label'
import { ChevronRight, CheckCircle, RefreshCw, Copy, Network } from 'lucide-react'
import { OS_TYPE_OPTIONS } from '@/features/instances/data/api-schema'
import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { applicationsApi } from '@/features/applications/api/applications-api'
import { useApplicationInstances } from '@/features/applications/hooks/use-application-instances'
import { Switch } from '@/components/ui/switch'
import { CodeEditor } from '@/components/code-editor'

const route = getRouteApi('/_authenticated/application-tasks')

export function ApplicationTasks() {
  const search = route.useSearch()
  const queryClient = useQueryClient()
  const [selectedInstances, setSelectedInstances] = useState<string[]>(() => {
    const appId = search.applicationId
    if (!appId) return []
    const key = `application-tasks:selectedInstances:${appId}`
    const saved = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    if (!saved) return []
    try {
      const arr = JSON.parse(saved)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  })
  const [taskType, setTaskType] = useState('shell_exec')
  const [httpDrawerOpen, setHttpDrawerOpen] = useState(false)
  const [httpParams, setHttpParams] = useState<any>({ method: 'GET', url: '', headers: [], query: [], body_type: 'none', timeout_seconds: 60, allow_redirects: false, verify_tls: false, parts: [], form_fields: [], raw_body: '', content_type: 'text/plain', json_body: {} })

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(1000)
  const [autoRefreshCount, setAutoRefreshCount] = useState(0)

  // 不同任务类型的参数状态
  const [shellScript, setShellScript] = useState('')
  const [codeContent, setCodeContent] = useState('')
  const [fileManagerOperation, setFileManagerOperation] = useState('upload_file')
  const [filePath, setFilePath] = useState('')
  const [remoteUrl, setRemoteUrl] = useState('')
  const [customCommand, setCustomCommand] = useState('')
  const [isMac, setIsMac] = useState(false)

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
    enabled: !!search.applicationId,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  })

  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null)
  const [taskInstances, setTaskInstances] = useState<any[]>([])
  const [selectedInstanceResult, setSelectedInstanceResult] = useState<any>(null)

  const instances = instancesData?.data || []
  const tasks = tasksData?.data || []

  React.useEffect(() => {
    if (!search.applicationId) return
    const key = `application-tasks:selectedInstances:${search.applicationId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const arr = JSON.parse(saved)
        if (Array.isArray(arr)) setSelectedInstances(arr)
      } catch { }
    }
  }, [search.applicationId])

  React.useEffect(() => {
    if (!search.applicationId) return
    const key = `application-tasks:selectedInstances:${search.applicationId}`
    localStorage.setItem(key, JSON.stringify(selectedInstances))
  }, [selectedInstances, search.applicationId])

  React.useEffect(() => {
    if (!instances.length) return
    setSelectedInstances(prev => prev.filter(id => instances.some(inst => inst.id === id)))
  }, [instances])

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
      'custom_command': '自定义命令',
      'http_request': 'HTTP请求',
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

  const getOSLabel = (os?: string) => {
    const found = OS_TYPE_OPTIONS.find(o => o.value === os)
    return found?.label || os || 'Unknown'
  }

  // 渲染不同任务类型的参数输入表单
  const renderTaskTypeForm = () => {
    switch (taskType) {
      case 'shell_exec':
        return (
          <CodeEditor
            language="shell"
            value={shellScript}
            onChange={(v: string) => setShellScript(v)}
            minHeight={140}
            autoResize={false}
            className="h-[130px] overflow-auto"
          />
        )

      case 'run_code':
        return (
          <div className="space-y-3">
            <CodeEditor
              language="java"
              value={codeContent}
              onChange={(v: string) => setCodeContent(v)}
              minHeight={140}
              autoResize={false}
              className="h-[130px] overflow-auto"
            />
          </div>
        )

      case 'file_manager':
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                value={fileManagerOperation}
                onChange={(e) => setFileManagerOperation(e.target.value)}
                className="flex-1 min-w-[126px] p-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="upload_file">上传文件</option>
                <option value="download_file">下载文件</option>
              </select>
              {fileManagerOperation === 'upload_file' && (
                <input
                  type="text"
                  placeholder="请输入需要上传的文件地址，如：http://example.com/test.txt"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  className="flex-5 p-2 border border-input rounded-md bg-background text-sm"
                />
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="请输入上传后文件保存路径，如：/tmp/test.txt"
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
            <select
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              className="flex-1 min-w-[120px] p-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="Shutdown">关闭应用</option>
              <option value="Restart">重启应用</option>
              <option value="DisableHttp">禁用HTTP</option>
              <option value="EnableHttp">启用HTTP</option>
            </select>
          </div>
        )

      case 'http_request':
        return (<div />)

      default:
        return null
    }
  }

  // 获取任务关联的实例和执行结果
  const { data: taskInstancesData } = useQuery({
    queryKey: ['task-instances', selectedTask],
    queryFn: () => {
      if (selectedTask) {
        if (autoRefreshEnabled) {
          setAutoRefreshCount((c) => c + 1);
        }
        return applicationsApi.getTaskInstancesWithResults(selectedTask);
      }
      else {
        return Promise.resolve(null)
      }
    },
    enabled: !!selectedTask,
    refetchOnWindowFocus: false,
    refetchInterval: () => (autoRefreshEnabled ? refreshIntervalMs : false),
  })

  const hasActiveInstances = (taskInstancesData?.data || []).some((item: any) => ['pending', 'dispatched', 'running'].includes(item.execution_record.status))
  const autoRefreshNotNeeded = !selectedTask || !hasActiveInstances

  React.useEffect(() => {
    if (!!selectedTask && hasActiveInstances) {
      setAutoRefreshEnabled(true)
    } else {
      setAutoRefreshEnabled(false)
    }
  }, [selectedTask, hasActiveInstances])

  React.useEffect(() => {
    if (!autoRefreshEnabled) setAutoRefreshCount(0)
  }, [autoRefreshEnabled])

  React.useEffect(() => {
    if (!selectedTask) setAutoRefreshCount(0)
  }, [selectedTask])

  React.useEffect(() => {
    if (autoRefreshNotNeeded) setAutoRefreshCount(0)
  }, [autoRefreshNotNeeded])

  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform))
  }, [])

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
        isValid = filePath.trim() !== '' && (fileManagerOperation !== 'upload_file' || remoteUrl.trim() !== '')
        taskContent.operation = fileManagerOperation
        taskContent.path = filePath
        if (fileManagerOperation === 'upload_file') {
          taskContent.remote_url = remoteUrl
        }
        break

      case 'custom_command':
        isValid = customCommand.trim() !== ''
        taskContent.command = customCommand
        break
      case 'http_request':
        isValid = !!httpParams.url && !!httpParams.method
        taskContent = buildHttpTaskContent(httpParams)
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
      setRemoteUrl('')
      setCustomCommand('')
      // setSelectedInstances([])

      // 刷新任务列表
      queryClient.invalidateQueries({ queryKey: ['tasks', search.applicationId] })

      // 延迟一下再选中新任务，确保数据已刷新
      setTimeout(() => {
        if (newTask?.id) {
          handleTaskSelect(newTask.id)
        }
      }, 100)

    } catch (error) {
      console.error('创建任务失败:', error)
      toast.error('任务创建失败，请重试')
    }
  }

  const submitRef = React.useRef<(() => void) | null>(null)
  React.useEffect(() => {
    submitRef.current = handleSubmitTask
  }, [handleSubmitTask])

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && ((isMac && e.metaKey) || (!isMac && e.ctrlKey))) {
        e.preventDefault()
        if (submitRef.current) submitRef.current()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isMac])

  // 处理任务选择
  const handleTaskSelect = async (taskId: string) => {
    setSelectedTask(taskId)
    const t = tasksData?.data?.find(t => t.id === taskId)
    setSelectedTaskType(t?.task_type || null)
    setSelectedInstanceResult(null)
  }

  // 处理实例选择
  const handleInstanceResultSelect = (instanceData: any) => {
    setSelectedInstanceResult(instanceData)
  }

  React.useEffect(() => {
    const list = taskInstancesData?.data || []
    setTaskInstances(list)
    const currentId = selectedInstanceResult?.instance?.id
    if (list.length === 0) {
      if (selectedInstanceResult) setSelectedInstanceResult(null)
      return
    }
    const matched = currentId ? list.find((it: any) => it.instance.id === currentId) : null
    if (matched) {
      setSelectedInstanceResult(matched)
    } else {
      setSelectedInstanceResult(list[0])
    }
  }, [taskInstancesData])

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

          <div className="flex gap-4 h-[300px] min-h-0 overflow-auto">
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
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">在线 {instances.length}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['application-instances', search.applicationId] })}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
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
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium truncate">
                              {instance.id}
                            </div>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {getOSLabel(instance.os_type)}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center w-full">
                            <p className="text-xs text-gray-600 truncate">
                              {instance.hostname || '未知主机名'}
                            </p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-xs text-gray-500 inline-flex items-center gap-1">
                                  <Network className="w-3 h-3" />
                                  <span>{instance.ip_address || '未知IP'}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={8}>
                                <div className="space-y-1">
                                  <div>内网IP: {instance.ip_address || '未知'}</div>
                                  <div>网卡地址: {instance.mac_address || '未知'}</div>
                                  <div>公网IP: {instance.public_ip || '未知'}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
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
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="http_request" id="http_request" />
                      <Label htmlFor="http_request" className="text-sm">HTTP 请求</Label>
                    </div>
                  </RadioGroup>
                </div>

                {renderTaskTypeForm()}

                {taskType === 'http_request' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">HTTP 请求参数较多，请点击右侧按钮设置详细参数</div>
                      <Button variant="outline" size="sm" onClick={() => setHttpDrawerOpen(true)}>设置详细参数</Button>
                    </div>
                    <div className="rounded border p-3 text-sm">
                      <div className="font-medium">概览</div>
                      <div className="mt-1 text-muted-foreground">{httpParams.method} {httpParams.url || '未设置URL'}</div>
                      <div className="mt-1">头部 {(Array.isArray(httpParams.headers) ? httpParams.headers : []).length} · 查询 {(Array.isArray(httpParams.query) ? httpParams.query : []).length} · 体 {httpParams.body_type}</div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleSubmitTask}
                  aria-keyshortcuts={isMac ? 'Meta+Enter' : 'Control+Enter'}
                >
                  发起任务
                  <span className="ml-2 text-xs text-muted-foreground">
                    {isMac ? '⌘ + 回车' : 'Ctrl + 回车'}
                  </span>
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
                <div className="flex items-center gap-2">
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
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTask === task.id
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 pr-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={autoRefreshNotNeeded}
                      onClick={() => setAutoRefreshEnabled((v) => !v)}
                    >
                      {autoRefreshNotNeeded
                        ? '不可用'
                        : (autoRefreshEnabled
                          ? `自动刷新中 · ${autoRefreshCount}次`
                          : '自动刷新已关闭')}
                    </Button>
                  </div>
                  <Select value={String(refreshIntervalMs)} onValueChange={(v) => setRefreshIntervalMs(Number(v))}>
                    <SelectTrigger disabled={autoRefreshNotNeeded} className="h-8 w-[90px]">
                      <SelectValue placeholder="间隔" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">1s</SelectItem>
                      <SelectItem value="5000">5s</SelectItem>
                      <SelectItem value="10000">10s</SelectItem>
                      <SelectItem value="30000">30s</SelectItem>
                      <SelectItem value="60000">60s</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-3">
                  {taskInstances.map((taskInstance) => (
                    <div
                      key={taskInstance.instance.id}
                      className={`relative p-3 rounded-lg border cursor-pointer transition-colors ${selectedInstanceResult?.instance.id === taskInstance.instance.id
                        ? 'bg-gray-50 border-gray-200 dark:bg-accent dark:border-gray-700'
                        : 'hover:bg-gray-50 dark:hover:bg-accent'
                        }`}
                      onClick={() => handleInstanceResultSelect(taskInstance)}
                    >
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="text-xs">
                          {getOSLabel(taskInstance.instance.os_type)}
                        </Badge>
                      </div>

                      <div className="text-sm font-medium truncate mb-1 pr-16">
                        {taskInstance.instance.id}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-600 truncate flex-1 mr-2">
                          {taskInstance.instance.hostname || '未知主机名'}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm text-gray-500 truncate max-w-[160px] inline-flex items-center gap-1">
                              <Network className="w-3 h-3" />
                              <span>{taskInstance.instance.ip_address || '未知IP'}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent sideOffset={8}>
                            <div className="space-y-1">
                              <div>内网IP: {taskInstance.instance.ip_address || '未知'}</div>
                              <div>网卡地址: {taskInstance.instance.mac_address || '未知'}</div>
                              <div>公网IP: {taskInstance.instance.public_ip || '未知'}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${taskInstance.execution_record.status === 'success'
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
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-lg font-semibold">执行结果</h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={!selectedInstanceResult}
                    onClick={async () => {
                      if (!selectedInstanceResult) return
                      const recordId = selectedInstanceResult.execution_record?.id
                      if (!recordId) {
                        toast.error('未找到执行记录ID')
                        return
                      }
                      try {
                        await applicationsApi.setTaskRecordPending(recordId)
                        toast.success('已重置为待执行')
                        if (selectedTask) {
                          queryClient.invalidateQueries({ queryKey: ['task-instances', selectedTask] })
                        }
                      } catch (e) {
                        toast.error('重试失败')
                      }
                    }}
                  >
                    重试
                  </Button>
                </div>
              </div>
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
                                    const isShellTask = selectedTaskType === 'shell_exec';

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
                              const isShellTask = ['shell_exec', 'run_code'].includes(selectedTaskType || '');

                              // 如果是shell任务且result_data是包含output的JSON对象
                              if (isShellTask && typeof selectedInstanceResult.execution_record.result_data === 'object') {
                                const resultObj = selectedInstanceResult.execution_record.result_data as any;
                                if (resultObj.output !== undefined && resultObj.output !== null) {
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
                        {/* {selectedInstanceResult.execution_record.retry_attempt !== undefined && selectedInstanceResult.execution_record.retry_attempt !== null && (
                          <div>
                            <span className="font-medium">重试次数:</span>
                            <div className="text-gray-600">{selectedInstanceResult.execution_record.retry_attempt}</div>
                          </div>
                        )} */}


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
                              const isShellTask = selectedTaskType === 'shell_exec';

                              // 如果是shell任务且result_data是包含output的JSON对象
                              if (isShellTask && typeof selectedInstanceResult.execution_record.result_data === 'object') {
                                const resultObj = selectedInstanceResult.execution_record.result_data as any;
                                if (resultObj.output !== undefined && resultObj.output !== null) {
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
                              const isShellTask = selectedTaskType === 'shell_exec';

                              // 如果是shell任务且result_data是包含output的JSON对象
                              if (isShellTask && typeof selectedInstanceResult.execution_record.result_data === 'object') {
                                const resultObj = selectedInstanceResult.execution_record.result_data as any;
                                if (resultObj.output !== undefined && resultObj.output !== null) {
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
      <HttpParamsDrawer open={httpDrawerOpen} onOpenChange={setHttpDrawerOpen} params={httpParams} onChange={setHttpParams} />
    </Main>
  )
}

interface HttpParamsDrawerProps { open: boolean; onOpenChange: (v: boolean) => void; params: any; onChange: (p: any) => void }
function HttpParamsDrawer({ open, onOpenChange, params, onChange }: HttpParamsDrawerProps) {
  const [local, setLocal] = React.useState<any>(params)
  React.useEffect(() => { if (open) setLocal(params) }, [open])
  const setField = (k: string, v: any) => setLocal({ ...local, [k]: v })
  const [jsonText, setJsonText] = React.useState<string>('')
  const [jsonInvalid, setJsonInvalid] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (!open) return
    try {
      const t = JSON.stringify(local.json_body || {}, null, 2)
      setJsonText(t)
      setJsonInvalid(false)
    } catch {
      setJsonText('{}')
      setJsonInvalid(false)
    }
  }, [open])



  // 监听方法变化，自动调整 body 相关设置
  React.useEffect(() => {
    if (!local.method) return;

    // 如果方法是 GET、HEAD、OPTIONS，隐藏 body 并清空
    if (['GET', 'HEAD', 'OPTIONS'].includes(local.method)) {
      setField('body_type', 'none');
      if (local.json_body) setField('json_body', {});
      if (local.form_fields) setField('form_fields', []);
    }
    // 如果方法是 POST、PUT、DELETE、PATCH，默认设置为 json
    else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(local.method)) {
      if (local.body_type === 'none') {
        setField('body_type', 'json');
      }
    }
  }, [local.method])
  const setKV = (k: 'headers' | 'query' | 'form_fields' | 'parts', idx: number, key: string, value: string) => {
    const arr = Array.isArray(local[k]) ? [...local[k]] : []
    arr[idx] = { ...(arr[idx] || {}), name: key, value }
    setLocal({ ...local, [k]: arr })
  }
  const addKV = (k: 'headers' | 'query' | 'form_fields') => { const arr = Array.isArray(local[k]) ? [...local[k]] : []; arr.push({ name: '', value: '' }); setLocal({ ...local, [k]: arr }) }
  const addFilePart = () => { const arr = Array.isArray(local.parts) ? [...local.parts] : []; arr.push({ type: 'file', name: '', file_path: '', filename: '', content_type: '' }); setLocal({ ...local, parts: arr }) }
  const addFieldPart = () => { const arr = Array.isArray(local.parts) ? [...local.parts] : []; arr.push({ type: 'field', name: '', value: '' }); setLocal({ ...local, parts: arr }) }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[800px] sm:w-[800px] sm:max-w-[800px]" onInteractOutside={(e) => e.preventDefault()}>
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>HTTP 请求参数</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-sm mb-2">方法</Label>
              <select value={local.method} onChange={(e) => setField('method', e.target.value)} className="w-full p-2 border rounded text-sm">
                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map(m => (<option key={m} value={m}>{m}</option>))}
              </select>
            </div>
            <div>
              <Label className="text-sm mb-2">超时(秒)</Label>
              <input type="number" value={local.timeout_seconds} onChange={(e) => setField('timeout_seconds', Number(e.target.value))} className="w-full p-2 border rounded text-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="allow_redirects" className="text-base mb-2">允许重定向</Label>
              <Switch id="allow_redirects" className='mt-0.8' checked={!!local.allow_redirects} onCheckedChange={(v) => setField('allow_redirects', v)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="verify_tls" className="text-base mb-2">验证TLS</Label>
              <Switch id="verify_tls" className='mt-0.8' checked={!!local.verify_tls} onCheckedChange={(v) => setField('verify_tls', v)} />
            </div>
          </div>
          <div>
            <Label className="text-sm mb-2">URL</Label>
            <input value={local.url} onChange={(e) => setField('url', e.target.value)} placeholder="https://example.com/api" className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
            <Label className="text-sm mb-2">Headers</Label>
            <div className="space-y-2">
              {(Array.isArray(local.headers) ? local.headers : []).map((it: any, idx: number) => (
                <div className="grid grid-cols-2 gap-2" key={idx}>
                  <input value={it.name || ''} onChange={(e) => setKV('headers', idx, e.target.value, it.value || '')} placeholder="Header 名" className="p-2 border rounded text-sm" />
                  <input value={it.value || ''} onChange={(e) => setKV('headers', idx, it.name || '', e.target.value)} placeholder="Header 值" className="p-2 border rounded text-sm" />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addKV('headers')}>添加Header</Button>
            </div>
          </div>

          {/* 只有当方法不是 GET、HEAD、OPTIONS 时才显示 Body 相关选项 */}
          {!['GET', 'HEAD', 'OPTIONS'].includes(local.method) && (
            <div>
              <Label className="text-sm mb-2">Body 类型</Label>
              <RadioGroup
                value={local.body_type}
                onValueChange={(value) => setField('body_type', value)}
                className="flex gap-3"
              >
                {['none', 'json', 'form', 'multipart', 'raw'].map(t => (
                  <div key={t} className="flex items-center gap-1">
                    <RadioGroupItem value={t} id={`body-type-${t}`} />
                    <Label htmlFor={`body-type-${t}`} className="text-sm">{t}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
          {/* 只有当方法不是 GET、HEAD、OPTIONS 时才显示所有 Body 相关内容 */}
          {!['GET', 'HEAD', 'OPTIONS'].includes(local.method) && (
            <>
              {local.body_type === 'json' && (
                <div>
                  <div className={`w-full rounded border ${jsonInvalid ? 'border-red-500' : 'border-input'}`}>
                    <Label className="text-sm">JSON Body</Label>
                    <CodeEditor
                      language="json"
                      value={jsonText}
                      minHeight={400}
                      onChange={(v: string) => {
                        setJsonText(v)
                        try {
                          const obj = JSON.parse(v || '{}')
                          setField('json_body', obj)
                          setJsonInvalid(false)
                        } catch {
                          setJsonInvalid(true)
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              {local.body_type === 'form' && (
                <div className="space-y-2">
                  {(Array.isArray(local.form_fields) ? local.form_fields : []).map((it: any, idx: number) => (
                    <div className="grid grid-cols-2 gap-2" key={idx}>
                      <input value={it.name || ''} onChange={(e) => setKV('form_fields', idx, e.target.value, it.value || '')} placeholder="字段名" className="p-2 border rounded text-sm" />
                      <input value={it.value || ''} onChange={(e) => setKV('form_fields', idx, it.name || '', e.target.value)} placeholder="字段值" className="p-2 border rounded text-sm" />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addKV('form_fields')}>添加字段</Button>
                </div>
              )}
              {local.body_type === 'raw' && (
                <div className="space-y-2">
                  <Label className="text-sm mb-2">Content-Type</Label>
                  <input value={local.content_type} onChange={(e) => setField('content_type', e.target.value)} className="w-full p-2 border rounded text-sm" />
                  <Label className="text-sm mb-2">Raw Body</Label>
                  <textarea
                    value={local.raw_body}
                    onChange={(e) => setField('raw_body', e.target.value)}
                    className="w-full p-2 border rounded text-sm font-mono resize-none"
                    style={{ minHeight: '400px', height: '400px' }}
                  />
                </div>
              )}
              {local.body_type === 'multipart' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={addFieldPart}>添加字段部件</Button>
                    <Button variant="outline" size="sm" onClick={addFilePart}>添加文件部件</Button>
                  </div>
                  {(Array.isArray(local.parts) ? local.parts : []).map((it: any, idx: number) => (
                    <div className="grid grid-cols-2 gap-2" key={idx}>
                      <input value={it.name || ''} onChange={(e) => { const arr = [...(local.parts || [])]; arr[idx] = { ...it, name: e.target.value }; setLocal({ ...local, parts: arr }) }} placeholder="部件名" className="p-2 border rounded text-sm" />
                      {it.type === 'file' ? (
                        <input value={it.file_path || ''} onChange={(e) => { const arr = [...(local.parts || [])]; arr[idx] = { ...it, file_path: e.target.value }; setLocal({ ...local, parts: arr }) }} placeholder="Agent 文件路径" className="p-2 border rounded text-sm" />
                      ) : (
                        <input value={it.value || ''} onChange={(e) => { const arr = [...(local.parts || [])]; arr[idx] = { ...it, value: e.target.value }; setLocal({ ...local, parts: arr }) }} placeholder="字段值" className="p-2 border rounded text-sm" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button onClick={() => { onChange(local); onOpenChange(false) }}>保存</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function buildHttpTaskContent(p: any) {
  const headers: Record<string, string> = {}
  const query: Record<string, string> = {}
  const form_fields: Record<string, string> = {}
    ; (p.headers || []).forEach((it: any) => { if (it?.name) headers[it.name] = String(it.value || '') })
    ; (p.query || []).forEach((it: any) => { if (it?.name) query[it.name] = String(it.value || '') })
    ; (p.form_fields || []).forEach((it: any) => { if (it?.name) form_fields[it.name] = String(it.value || '') })
  return {
    method: p.method,
    url: p.url,
    timeout_seconds: Number(p.timeout_seconds) || 60,
    allow_redirects: !!p.allow_redirects,
    verify_tls: !!p.verify_tls,
    headers,
    body_type: p.body_type,
    json_body: p.json_body,
    form_fields,
    raw_body: p.raw_body,
    content_type: p.content_type,
    parts: p.parts || [],
  }
}
