import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { DEFAULT_PAGE_SIZE } from '@/config/pagination'
import {
  ChevronRight,
  CheckCircle,
  RefreshCw,
  Network,
  Coffee,
  Cog,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { formatDateTime } from '@/lib/datetime'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { CodeEditor } from '@/components/code-editor'
import { Main } from '@/components/layout/main'
import { LongText } from '@/components/long-text'
import { applicationsApi } from '@/features/applications/api/applications-api'
import { useApplicationInstances } from '@/features/applications/hooks/use-application-instances'
import { OS_TYPE_OPTIONS } from '@/features/instances/data/api-schema'
import { ExecutionResultPanel } from './execution-result'

const route = getRouteApi('/_authenticated/application-tasks')

export function ApplicationTasks() {
  const search = route.useSearch()
  const queryClient = useQueryClient()
  const [selectedInstances, setSelectedInstances] = useState<string[]>(() => {
    const appId = search.applicationId
    if (!appId) return []
    const key = `application-tasks:selectedInstances:${appId}`
    const saved =
      typeof window !== 'undefined' ? localStorage.getItem(key) : null
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
  const [httpParams, setHttpParams] = useState<any>({
    method: 'GET',
    url: '',
    headers: [],
    query: [],
    body_type: 'none',
    timeout_seconds: 60,
    allow_redirects: false,
    verify_tls: false,
    parts: [],
    form_fields: [],
    raw_body: '',
    content_type: 'text/plain',
    json_body: {},
  })

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(1000)
  const [autoRefreshCount, setAutoRefreshCount] = useState(0)

  // 不同任务类型的参数状态
  const [shellScript, setShellScript] = useState('')
  const [codeContent, setCodeContent] = useState('')
  const [fileManagerOperation, setFileManagerOperation] =
    useState('upload_file')
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
  const { data: instancesData } = useApplicationInstances(
    search.applicationId || ''
  )

  // 获取任务列表
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', search.applicationId],
    queryFn: () =>
      applicationsApi.getTasks({
        application_id: search.applicationId,
        limit: DEFAULT_PAGE_SIZE,
      }),
    enabled: !!search.applicationId,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  })

  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null)
  const [taskInstances, setTaskInstances] = useState<any[]>([])
  const [selectedInstanceResult, setSelectedInstanceResult] =
    useState<any>(null)

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
      } catch {}
    }
  }, [search.applicationId])

  React.useEffect(() => {
    if (!search.applicationId) return
    const key = `application-tasks:selectedInstances:${search.applicationId}`
    localStorage.setItem(key, JSON.stringify(selectedInstances))
  }, [selectedInstances, search.applicationId])

  React.useEffect(() => {
    if (!instances.length) return
    setSelectedInstances((prev) =>
      prev.filter((id) => instances.some((inst) => inst.id === id))
    )
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

  const typeMap: Record<string, string> = {
    shell_exec: '执行Shell',
    http_request: 'HTTP请求',
    file_manager: '文件管理',
    custom_command: '自定义命令',
    run_code: '运行Code',
  }

  // 任务类型中文映射
  const getTaskTypeLabel = (taskType: string) => {
    return typeMap[taskType] || taskType
  }

  // 执行状态中文映射
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      dispatched: '已分发',
      success: '成功',
      failed: '失败',
      running: '运行中',
      pending: '等待中',
      cancelled: '已取消',
      timeout: '超时',
    }
    return statusMap[status] || status
  }

  const getOSLabel = (os?: string) => {
    const found = OS_TYPE_OPTIONS.find((o) => o.value === os)
    return found?.label || os || 'Unknown'
  }

  const AgentTypeIcon = ({
    type,
    className = '',
  }: {
    type?: string
    className?: string
  }) => {
    const size = 'w-4 h-4'
    if (type === 'java') {
      return <Coffee className={`${size} text-amber-600 ${className}`} />
    }
    if (type === 'rust_agent') {
      return <Cog className={`${size} text-orange-500 ${className}`} />
    }
    return null
  }

  const getAgentLabel = (type?: string) => {
    if (type === 'java') return 'Java'
    if (type === 'rust_agent') return 'Rust Agent'
    return 'Unknown'
  }

  const formatIp = (ip?: string) => {
    const s = ip || ''
    if (!s) return '未知IP'
    const i = s.indexOf(',')
    return i >= 0 ? s.slice(0, i) : s
  }

  // 渲染不同任务类型的参数输入表单
  const renderTaskTypeForm = () => {
    switch (taskType) {
      case 'shell_exec':
        return (
          <CodeEditor
            language='shell'
            value={shellScript}
            onChange={(v: string) => setShellScript(v)}
            minHeight={130}
            autoResize={false}
            className='h-[132px] overflow-auto'
          />
        )

      case 'run_code':
        return (
          <div className='space-y-3'>
            <CodeEditor
              language='java'
              value={codeContent}
              onChange={(v: string) => setCodeContent(v)}
              minHeight={130}
              autoResize={false}
              className='h-[132px] overflow-auto'
            />
          </div>
        )

      case 'file_manager':
        return (
          <div className='space-y-3'>
            <div className='flex gap-2'>
              <select
                value={fileManagerOperation}
                onChange={(e) => setFileManagerOperation(e.target.value)}
                className='border-input bg-background min-w-[126px] flex-1 rounded-md border p-2 text-sm'
              >
                <option value='upload_file'>上传文件</option>
                <option value='download_file'>下载文件</option>
              </select>
              {fileManagerOperation === 'upload_file' && (
                <input
                  type='text'
                  placeholder='请输入需要上传的文件地址，如：http://example.com/test.txt'
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  className='border-input bg-background flex-5 rounded-md border p-2 text-sm'
                />
              )}
            </div>
            <div>
              <input
                type='text'
                placeholder='请输入上传后文件保存路径，如：/tmp/test.txt'
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className='border-input bg-background w-full rounded-md border p-2 text-sm'
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
              className='border-input bg-background min-w-[120px] flex-1 rounded-md border p-2 text-sm'
            >
              <option value='Shutdown'>关闭应用</option>
              <option value='Restart'>重启应用</option>
              <option value='DisableHttp'>禁用HTTP</option>
              <option value='EnableHttp'>启用HTTP</option>
            </select>
          </div>
        )

      case 'http_request':
        return <div />

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
          setAutoRefreshCount((c) => c + 1)
        }
        return applicationsApi.getTaskInstancesWithResults(selectedTask)
      } else {
        return Promise.resolve(null)
      }
    },
    enabled: !!selectedTask,
    refetchOnWindowFocus: false,
    refetchInterval: () => (autoRefreshEnabled ? refreshIntervalMs : false),
  })

  const hasActiveInstances = (taskInstancesData?.data || []).some((item: any) =>
    ['pending', 'dispatched', 'running'].includes(item.execution_record.status)
  )
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
    setSelectedInstances((prev) =>
      prev.includes(instanceId)
        ? prev.filter((id) => id !== instanceId)
        : [...prev, instanceId]
    )
  }

  const handleSelectAll = () => {
    if (selectedInstances.length === instances.length) {
      setSelectedInstances([])
    } else {
      setSelectedInstances(instances.map((instance) => instance.id))
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
        isValid =
          filePath.trim() !== '' &&
          (fileManagerOperation !== 'upload_file' || remoteUrl.trim() !== '')
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

    if (!isValid) {
      toast.error('请填写必要的参数')
      return
    }

    if (selectedInstances.length === 0) {
      toast.error('请选择至少一个实例')
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
      // setShellScript('')
      // setCodeContent('')
      // setFilePath('')
      // setRemoteUrl('')
      // setCustomCommand('')
      // setSelectedInstances([])

      // 刷新任务列表
      queryClient.invalidateQueries({
        queryKey: ['tasks', search.applicationId],
      })

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
      if (
        e.key === 'Enter' &&
        ((isMac && e.metaKey) || (!isMac && e.ctrlKey))
      ) {
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
    const t = tasksData?.data?.find((t) => t.id === taskId)
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
    const matched = currentId
      ? list.find((it: any) => it.instance.id === currentId)
      : null
    if (matched) {
      setSelectedInstanceResult(matched)
    } else {
      setSelectedInstanceResult(list[0])
    }
  }, [taskInstancesData])

  return (
    <Main fixed className='flex h-full flex-col overflow-hidden'>
      <div className='flex h-full min-h-0 flex-1 flex-col overflow-auto'>
        {/* 页面标题区域 */}
        <div className='shrink-0 overflow-auto p-4'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-2xl font-bold tracking-tight'>
              应用：{application?.name}
              <span className='pl-2 text-sm text-gray-500'>
                ID：{application?.id}
              </span>
            </h2>
          </div>

          <div className='grid h-[300px] min-h-0 grid-cols-1 gap-4 overflow-auto lg:grid-cols-[1fr_1fr_2fr]'>
            {/* 在线实例 */}
            <Card className='col-span-2 flex h-full min-h-0 flex-col p-4'>
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center'>
                  <Button variant='outline' size='sm' onClick={handleSelectAll}>
                    {selectedInstances.length === instances.length
                      ? '取消全选'
                      : '全选'}
                  </Button>
                  <h3 className='ml-2 text-lg font-semibold'>在线实例</h3>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>在线 {instances.length}</Badge>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: [
                          'application-instances',
                          search.applicationId,
                        ],
                      })
                    }
                  >
                    <RefreshCw className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              <ScrollArea className='flex-1 rounded-lg'>
                <div className='grid grid-cols-2 gap-2'>
                  {instances.map((instance) => (
                    <div
                      key={instance.id}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        selectedInstances.includes(instance.id)
                          ? 'dark:bg-accent border-gray-200 bg-gray-50 dark:border-gray-700'
                          : 'dark:hover:bg-accent hover:bg-gray-50'
                      }`}
                      onClick={() => handleInstanceSelect(instance.id)}
                    >
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                            selectedInstances.includes(instance.id)
                              ? 'border-gray-600 bg-gray-600 dark:border-gray-400 dark:bg-gray-400'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {selectedInstances.includes(instance.id) && (
                            <CheckCircle className='h-3 w-3 text-white' />
                          )}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center justify-between'>
                            <div className='truncate text-sm font-medium'>
                              {instance.id}
                            </div>
                            <div className='ml-2 flex items-center'>
                              <Badge variant='outline' className='text-xs'>
                                {getOSLabel(instance.os_type)}
                              </Badge>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <AgentTypeIcon
                                      type={instance.agent_type}
                                      className='ml-1'
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent sideOffset={8}>
                                  <div className='text-xs'>
                                    {getAgentLabel(instance.agent_type)}{' '}
                                    {instance.agent_version
                                      ? `v${instance.agent_version}`
                                      : '未上报版本'}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          <div className='flex w-full items-center justify-between'>
                            <p className='truncate text-xs text-gray-600'>
                              {instance.hostname || '未知主机名'}
                            </p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className='inline-flex items-center gap-1 text-xs text-gray-500'>
                                  <Network className='h-3 w-3' />
                                  <span>{formatIp(instance.ip_address)}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={8}>
                                <div className='space-y-1'>
                                  <div>
                                    内网IP: {instance.ip_address || '未知'}
                                  </div>
                                  <div>
                                    网卡地址: {instance.mac_address || '未知'}
                                  </div>
                                  <div>
                                    公网IP: {instance.public_ip || '未知'}
                                  </div>
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
            <Card className='flex h-full min-h-0 flex-col p-4'>
              <h3 className='mb-4 text-lg font-semibold'>创建任务</h3>

              <div className='space-y-4'>
                <div>
                  <RadioGroup
                    value={taskType}
                    onValueChange={setTaskType}
                    className='flex flex-row gap-4'
                  >
                    {Object.keys(typeMap).map((key) => (
                      <div className='flex items-center space-x-2' key={key}>
                        <RadioGroupItem value={key} id={key} />
                        <Label htmlFor={key} className='text-sm'>
                          {typeMap[key]}
                        </Label>
                        {(key === 'custom_command' || key === 'run_code') && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='inline-flex'>
                                <Info className='text-muted-foreground h-3 w-3' />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={8}>
                              <div className='text-xs'>
                                该功能仅支持 java类型的代理
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {renderTaskTypeForm()}

                {taskType === 'http_request' && (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <div className='text-muted-foreground text-sm'>
                        HTTP 请求参数较多，请点击右侧按钮设置详细参数
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setHttpDrawerOpen(true)}
                      >
                        设置详细参数
                      </Button>
                    </div>
                    <div className='rounded border p-3 text-sm'>
                      <div className='font-medium'>概览</div>
                      <div className='text-muted-foreground mt-1'>
                        {httpParams.method} {httpParams.url || '未设置URL'}
                      </div>
                      <div className='mt-1'>
                        头部{' '}
                        {
                          (Array.isArray(httpParams.headers)
                            ? httpParams.headers
                            : []
                          ).length
                        }{' '}
                        · 查询{' '}
                        {
                          (Array.isArray(httpParams.query)
                            ? httpParams.query
                            : []
                          ).length
                        }{' '}
                        · 体 {httpParams.body_type}
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className='w-full'
                  onClick={handleSubmitTask}
                  aria-keyshortcuts={isMac ? 'Meta+Enter' : 'Control+Enter'}
                >
                  发起任务
                  <span className='text-muted-foreground ml-2 text-xs'>
                    {isMac ? '⌘ + 回车' : 'Ctrl + 回车'}
                  </span>
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* 底部三个区域 */}
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden p-4 pt-0'>
          <div className='grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_2fr] lg:grid-rows-2'>
            {/* 任务历史 */}
            <Card className='h-full min-h-0 flex-col p-4 lg:row-span-2'>
              <div className='mb-4 flex shrink-0 items-center justify-between'>
                <h3 className='text-lg font-semibold'>任务历史</h3>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: ['tasks', search.applicationId],
                      })
                    }
                    disabled={!search.applicationId}
                  >
                    <RefreshCw className='mr-2 h-4 w-4' />
                    刷新
                  </Button>
                </div>
              </div>
              <ScrollArea className='min-h-0 flex-1'>
                <div className='space-y-3'>
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        selectedTask === task.id
                          ? 'dark:bg-accent border-gray-200 bg-gray-50 dark:border-gray-700'
                          : 'dark:hover:bg-accent hover:bg-gray-50'
                      }`}
                      onClick={() => handleTaskSelect(task.id)}
                    >
                      <div className='mb-2 flex items-center justify-between'>
                        <Badge variant='outline' className='text-xs'>
                          {getTaskTypeLabel(task.task_type)}
                        </Badge>
                        <div className='flex items-center space-x-2'>
                          <span className='text-sm font-medium text-green-600'>
                            {task.target_instances?.length || 0}&nbsp;个实例
                          </span>
                          <ChevronRight className='h-4 w-4 text-gray-400' />
                        </div>
                      </div>
                      <div className='flex items-center justify-between text-xs text-gray-500'>
                        <LongText className='mb-1 w-1/2 text-sm text-gray-700'>
                          {task.task_name}
                        </LongText>
                        <span>{formatDateTime(task.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* 相关实例 */}
            <Card className='flex h-full min-h-0 flex-col p-4 lg:row-span-2'>
              <div className='mb-4 flex shrink-0 items-center justify-between'>
                <h3 className='text-lg font-semibold'>相关实例</h3>
                <div className='flex items-center gap-2'>
                  <div className='flex items-center gap-2 pr-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={autoRefreshNotNeeded}
                      onClick={() => setAutoRefreshEnabled((v) => !v)}
                    >
                      {autoRefreshNotNeeded
                        ? '不可用'
                        : autoRefreshEnabled
                          ? `自动刷新中 · ${autoRefreshCount}次`
                          : '自动刷新已关闭'}
                    </Button>
                  </div>
                  <Select
                    value={String(refreshIntervalMs)}
                    onValueChange={(v) => setRefreshIntervalMs(Number(v))}
                  >
                    <SelectTrigger
                      disabled={autoRefreshNotNeeded}
                      className='h-8 w-[90px]'
                    >
                      <SelectValue placeholder='间隔' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1000'>1s</SelectItem>
                      <SelectItem value='5000'>5s</SelectItem>
                      <SelectItem value='10000'>10s</SelectItem>
                      <SelectItem value='30000'>30s</SelectItem>
                      <SelectItem value='60000'>60s</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: ['task-instances', selectedTask],
                      })
                    }
                    disabled={!selectedTask}
                  >
                    <RefreshCw className='mr-2 h-4 w-4' />
                    刷新
                  </Button>
                </div>
              </div>
              <ScrollArea className='min-h-0 flex-1'>
                <div className='space-y-3'>
                  {taskInstances.map((taskInstance) => (
                    <div
                      key={taskInstance.instance.id}
                      className={`relative cursor-pointer rounded-lg border p-3 transition-colors ${
                        selectedInstanceResult?.instance.id ===
                        taskInstance.instance.id
                          ? 'dark:bg-accent border-gray-200 bg-gray-50 dark:border-gray-700'
                          : 'dark:hover:bg-accent hover:bg-gray-50'
                      }`}
                      onClick={() => handleInstanceResultSelect(taskInstance)}
                    >
                      <div className='absolute top-2 right-2 flex items-center'>
                        <Badge variant='outline' className='text-xs'>
                          {getOSLabel(taskInstance.instance.os_type)}
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <AgentTypeIcon
                                type={taskInstance.instance.agent_type}
                                className='ml-1'
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent sideOffset={8}>
                            <div className='text-xs'>
                              {getAgentLabel(taskInstance.instance.agent_type)}{' '}
                              {taskInstance.instance.agent_version
                                ? `v${taskInstance.instance.agent_version}`
                                : '未上报版本'}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className='mb-1 truncate pr-16 text-sm font-medium'>
                        {taskInstance.instance.id}
                      </div>
                      <div className='mb-2 flex items-center justify-between'>
                        <div className='mr-2 flex-1 truncate text-sm text-gray-600'>
                          {taskInstance.instance.hostname || '未知主机名'}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className='inline-flex max-w-[160px] items-center gap-1 truncate text-sm text-gray-500'>
                              <Network className='h-3 w-3' />
                              <span>
                                {formatIp(taskInstance.instance.ip_address)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent sideOffset={8}>
                            <div className='space-y-1'>
                              <div>
                                内网IP:{' '}
                                {taskInstance.instance.ip_address || '未知'}
                              </div>
                              <div>
                                网卡地址:{' '}
                                {taskInstance.instance.mac_address || '未知'}
                              </div>
                              <div>
                                公网IP:{' '}
                                {taskInstance.instance.public_ip || '未知'}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                          <Badge
                            variant='outline'
                            className={`text-xs ${
                              taskInstance.execution_record.status === 'success'
                                ? 'border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                                : taskInstance.execution_record.status ===
                                    'failed'
                                  ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
                                  : taskInstance.execution_record.status ===
                                      'running'
                                    ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400'
                                    : taskInstance.execution_record.status ===
                                        'dispatched'
                                      ? 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400'
                                      : taskInstance.execution_record.status ===
                                          'timeout'
                                        ? 'border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400'
                                        : taskInstance.execution_record
                                              .status === 'cancelled'
                                          ? 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                          : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {getStatusLabel(
                              taskInstance.execution_record.status
                            )}
                          </Badge>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <span className='text-xs text-gray-500'>
                            {taskInstance.execution_record.start_time
                              ? formatDateTime(
                                  taskInstance.execution_record.start_time
                                )
                              : taskInstance.instance.updated_at
                                ? formatDateTime(
                                    taskInstance.instance.updated_at
                                  )
                                : '未开始'}
                          </span>
                          <ChevronRight className='h-4 w-4 text-gray-400' />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* 执行结果 / 文件夹 */}
            <Card className='flex h-full min-h-0 flex-col p-4 lg:row-span-2'>
              <Tabs defaultValue='result' className='flex h-full flex-col'>
                <div className='mb-2 flex shrink-0 items-center justify-between'>
                  <TabsList>
                    <TabsTrigger value='result'>执行结果</TabsTrigger>
                    <TabsTrigger value='files'>文件夹</TabsTrigger>
                  </TabsList>
                  <div className='flex items-center gap-2'>
                    <Button
                      size='sm'
                      disabled={!selectedInstanceResult}
                      onClick={async () => {
                        if (!selectedInstanceResult) return
                        const recordId =
                          selectedInstanceResult.execution_record?.id
                        if (!recordId) {
                          toast.error('未找到执行记录ID')
                          return
                        }
                        try {
                          await applicationsApi.setTaskRecordPending(recordId)
                          toast.success('已重置为待执行')
                          if (selectedTask) {
                            queryClient.invalidateQueries({
                              queryKey: ['task-instances', selectedTask],
                            })
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
                <TabsContent
                  value='result'
                  className='flex min-h-0 flex-1 flex-col'
                >
                  <ExecutionResultPanel
                    selectedInstanceResult={selectedInstanceResult}
                    selectedTaskType={selectedTaskType}
                    copyToClipboard={copyToClipboard}
                  />
                </TabsContent>
                <TabsContent
                  value='files'
                  className='flex min-h-0 flex-1 flex-col'
                >
                  <TaskFilesPane
                    selectedTask={selectedTask}
                    selectedInstanceId={selectedInstanceResult?.instance?.id}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
      <HttpParamsDrawer
        open={httpDrawerOpen}
        onOpenChange={setHttpDrawerOpen}
        params={httpParams}
        onChange={setHttpParams}
      />
    </Main>
  )
}

interface HttpParamsDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  params: any
  onChange: (p: any) => void
}
function HttpParamsDrawer({
  open,
  onOpenChange,
  params,
  onChange,
}: HttpParamsDrawerProps) {
  const [local, setLocal] = React.useState<any>(params)
  React.useEffect(() => {
    if (open) setLocal(params)
  }, [open])
  const setField = (k: string, v: any) => setLocal({ ...local, [k]: v })
  const [jsonText, setJsonText] = React.useState<string>('')

  React.useEffect(() => {
    if (!open) return
    try {
      const t = JSON.stringify(local.json_body || {}, null, 2)
      setJsonText(t)
    } catch {
      setJsonText('{}')
    }
  }, [open])

  // 监听方法变化，自动调整 body 相关设置
  React.useEffect(() => {
    if (!local.method) return

    // 如果方法是 GET、HEAD、OPTIONS，隐藏 body 并清空
    if (['GET', 'HEAD', 'OPTIONS'].includes(local.method)) {
      setField('body_type', 'none')
      if (local.json_body) setField('json_body', {})
      if (local.form_fields) setField('form_fields', [])
    }
    // 如果方法是 POST、PUT、DELETE、PATCH，默认设置为 json
    else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(local.method)) {
      if (local.body_type === 'none') {
        setField('body_type', 'json')
      }
    }
  }, [local.method])
  const setKV = (
    k: 'headers' | 'query' | 'form_fields' | 'parts',
    idx: number,
    key: string,
    value: string
  ) => {
    const arr = Array.isArray(local[k]) ? [...local[k]] : []
    arr[idx] = { ...(arr[idx] || {}), name: key, value }
    setLocal({ ...local, [k]: arr })
  }
  const addKV = (k: 'headers' | 'query' | 'form_fields') => {
    const arr = Array.isArray(local[k]) ? [...local[k]] : []
    arr.push({ name: '', value: '' })
    setLocal({ ...local, [k]: arr })
  }
  const addFilePart = () => {
    const arr = Array.isArray(local.parts) ? [...local.parts] : []
    arr.push({
      type: 'file',
      name: '',
      file_path: '',
      filename: '',
      content_type: '',
    })
    setLocal({ ...local, parts: arr })
  }
  const addFieldPart = () => {
    const arr = Array.isArray(local.parts) ? [...local.parts] : []
    arr.push({ type: 'field', name: '', value: '' })
    setLocal({ ...local, parts: arr })
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='w-[800px] sm:w-[800px] sm:max-w-[800px]'
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className='px-6 pt-6'>
          <SheetTitle>HTTP 请求参数</SheetTitle>
        </SheetHeader>
        <div className='flex-1 space-y-4 overflow-y-auto px-6 py-4'>
          <div className='grid grid-cols-4 gap-3'>
            <div>
              <Label className='mb-2 text-sm'>方法</Label>
              <select
                value={local.method}
                onChange={(e) => setField('method', e.target.value)}
                className='w-full rounded border p-2 text-sm'
              >
                {[
                  'GET',
                  'POST',
                  'PUT',
                  'DELETE',
                  'PATCH',
                  'HEAD',
                  'OPTIONS',
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className='mb-2 text-sm'>超时(秒)</Label>
              <input
                type='number'
                value={local.timeout_seconds}
                onChange={(e) =>
                  setField('timeout_seconds', Number(e.target.value))
                }
                className='w-full rounded border p-2 text-sm'
              />
            </div>
            <div className='space-y-1'>
              <Label htmlFor='allow_redirects' className='mb-2 text-base'>
                允许重定向
              </Label>
              <Switch
                id='allow_redirects'
                className='mt-0.8'
                checked={!!local.allow_redirects}
                onCheckedChange={(v) => setField('allow_redirects', v)}
              />
            </div>
            <div className='space-y-1'>
              <Label htmlFor='verify_tls' className='mb-2 text-base'>
                验证TLS
              </Label>
              <Switch
                id='verify_tls'
                className='mt-0.8'
                checked={!!local.verify_tls}
                onCheckedChange={(v) => setField('verify_tls', v)}
              />
            </div>
          </div>
          <div>
            <Label className='mb-2 text-sm'>URL</Label>
            <input
              value={local.url}
              onChange={(e) => setField('url', e.target.value)}
              placeholder='https://example.com/api'
              className='w-full rounded border p-2 text-sm'
            />
          </div>
          <div>
            <Label className='mb-2 text-sm'>Headers</Label>
            <div className='space-y-2'>
              {(Array.isArray(local.headers) ? local.headers : []).map(
                (it: any, idx: number) => (
                  <div className='grid grid-cols-2 gap-2' key={idx}>
                    <input
                      value={it.name || ''}
                      onChange={(e) =>
                        setKV('headers', idx, e.target.value, it.value || '')
                      }
                      placeholder='Header 名'
                      className='rounded border p-2 text-sm'
                    />
                    <input
                      value={it.value || ''}
                      onChange={(e) =>
                        setKV('headers', idx, it.name || '', e.target.value)
                      }
                      placeholder='Header 值'
                      className='rounded border p-2 text-sm'
                    />
                  </div>
                )
              )}
              <Button
                variant='outline'
                size='sm'
                onClick={() => addKV('headers')}
              >
                添加Header
              </Button>
            </div>
          </div>

          {/* 只有当方法不是 GET、HEAD、OPTIONS 时才显示 Body 相关选项 */}
          {!['GET', 'HEAD', 'OPTIONS'].includes(local.method) && (
            <div>
              <Label className='mb-2 text-sm'>Body 类型</Label>
              <RadioGroup
                value={local.body_type}
                onValueChange={(value) => setField('body_type', value)}
                className='flex gap-3'
              >
                {['none', 'json', 'form', 'multipart', 'raw'].map((t) => (
                  <div key={t} className='flex items-center gap-1'>
                    <RadioGroupItem value={t} id={`body-type-${t}`} />
                    <Label htmlFor={`body-type-${t}`} className='text-sm'>
                      {t}
                    </Label>
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
                  <div className={`mb-2 w-full`}>
                    <Label className='text-sm'>JSON Body</Label>
                    <CodeEditor
                      language='json'
                      value={jsonText}
                      minHeight={400}
                      onChange={(v: string) => {
                        setJsonText(v)
                        try {
                          const obj = JSON.parse(v || '{}')
                          setField('json_body', obj)
                        } catch {
                          // JSON 解析失败时忽略
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              {local.body_type === 'form' && (
                <div className='space-y-2'>
                  {(Array.isArray(local.form_fields)
                    ? local.form_fields
                    : []
                  ).map((it: any, idx: number) => (
                    <div className='grid grid-cols-2 gap-2' key={idx}>
                      <input
                        value={it.name || ''}
                        onChange={(e) =>
                          setKV(
                            'form_fields',
                            idx,
                            e.target.value,
                            it.value || ''
                          )
                        }
                        placeholder='字段名'
                        className='rounded border p-2 text-sm'
                      />
                      <input
                        value={it.value || ''}
                        onChange={(e) =>
                          setKV(
                            'form_fields',
                            idx,
                            it.name || '',
                            e.target.value
                          )
                        }
                        placeholder='字段值'
                        className='rounded border p-2 text-sm'
                      />
                    </div>
                  ))}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => addKV('form_fields')}
                  >
                    添加字段
                  </Button>
                </div>
              )}
              {local.body_type === 'raw' && (
                <div className='space-y-2'>
                  <Label className='mb-2 text-sm'>Content-Type</Label>
                  <input
                    value={local.content_type}
                    onChange={(e) => setField('content_type', e.target.value)}
                    className='w-full rounded border p-2 text-sm'
                  />
                  <Label className='mb-2 text-sm'>Raw Body</Label>
                  <textarea
                    value={local.raw_body}
                    onChange={(e) => setField('raw_body', e.target.value)}
                    className='w-full resize-none rounded border p-2 font-mono text-sm'
                    style={{ minHeight: '400px', height: '400px' }}
                  />
                </div>
              )}
              {local.body_type === 'multipart' && (
                <div className='space-y-2'>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm' onClick={addFieldPart}>
                      添加字段部件
                    </Button>
                    <Button variant='outline' size='sm' onClick={addFilePart}>
                      添加文件部件
                    </Button>
                  </div>
                  {(Array.isArray(local.parts) ? local.parts : []).map(
                    (it: any, idx: number) => (
                      <div className='grid grid-cols-2 gap-2' key={idx}>
                        <input
                          value={it.name || ''}
                          onChange={(e) => {
                            const arr = [...(local.parts || [])]
                            arr[idx] = { ...it, name: e.target.value }
                            setLocal({ ...local, parts: arr })
                          }}
                          placeholder='部件名'
                          className='rounded border p-2 text-sm'
                        />
                        {it.type === 'file' ? (
                          <input
                            value={it.file_path || ''}
                            onChange={(e) => {
                              const arr = [...(local.parts || [])]
                              arr[idx] = { ...it, file_path: e.target.value }
                              setLocal({ ...local, parts: arr })
                            }}
                            placeholder='Agent 文件路径'
                            className='rounded border p-2 text-sm'
                          />
                        ) : (
                          <input
                            value={it.value || ''}
                            onChange={(e) => {
                              const arr = [...(local.parts || [])]
                              arr[idx] = { ...it, value: e.target.value }
                              setLocal({ ...local, parts: arr })
                            }}
                            placeholder='字段值'
                            className='rounded border p-2 text-sm'
                          />
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button
              onClick={() => {
                onChange(local)
                onOpenChange(false)
              }}
            >
              保存
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

interface TaskFilesPaneProps {
  selectedTask: string | null
  selectedInstanceId?: string
}

type FileItem = {
  id: string
  file_name: string
  file_size: number
  uploaded_at: string
  file_path?: string
  download_url?: string
}

function TaskFilesPane({
  selectedTask,
  selectedInstanceId,
}: TaskFilesPaneProps) {
  const enabled = !!(selectedTask && selectedInstanceId)
  const { data, isLoading, isError } = useQuery<
    { data: FileItem[] } | undefined
  >({
    queryKey: ['task-files', selectedTask, selectedInstanceId],
    queryFn: async () => {
      const params = new URLSearchParams({
        task_id: String(selectedTask),
        instance_id: String(selectedInstanceId),
        order_by: 'uploaded_at',
        order: 'asc',
      })
      const res = await apiClient.get<{ data: FileItem[] }>(
        `/api/files?${params.toString()}`
      )
      return res.data
    },
    enabled,
    refetchOnWindowFocus: false,
  })

  if (!enabled) {
    return (
      <div className='py-8 text-center text-gray-500'>
        <p>请先选择实例以查看关联文件</p>
      </div>
    )
  }

  if (isLoading) {
    return <div className='py-8 text-center text-gray-500'>加载中…</div>
  }

  if (isError) {
    return <div className='py-8 text-center text-red-600'>文件查询失败</div>
  }

  const files = data?.data || []

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const copyToClipboard = (file: FileItem) => {
    navigator.clipboard.writeText(file.download_url || '')
    toast.success('下载地址已复制')
  }

  const handleDownload = async (file: FileItem) => {
    try {
      const endpoint = file.download_url || `/api/files/download/${file.id}`
      const { blob, fileName } = await apiClient.download(endpoint)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName || file.file_name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('开始下载')
    } catch (e) {
      toast.error('下载失败')
    }
  }

  return (
    <div className='flex-1 overflow-auto'>
      {files.length === 0 ? (
        <div className='py-8 text-center text-gray-500'>未找到关联文件</div>
      ) : (
        <div className='flex flex-col gap-3 overflow-auto'>
          {files.map((f) => (
            <Card key={f.id} className='p-3'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='truncate font-medium' title={f.file_name}>
                  {f.file_name}
                </div>
                <div>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => copyToClipboard(f)}
                  >
                    复制路径
                  </Button>
                  <Button
                    className='ml-1'
                    size='sm'
                    variant='outline'
                    onClick={() => handleDownload(f)}
                  >
                    下载
                  </Button>
                </div>
              </div>
              <div className='space-y-1 text-sm text-gray-600'>
                <div>大小：{fmtSize(f.file_size)}</div>
                <div>上传完成时间：{formatDateTime(f.uploaded_at)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function buildHttpTaskContent(p: any) {
  const headers: Record<string, string> = {}
  const query: Record<string, string> = {}
  const form_fields: Record<string, string> = {}
  ;(p.headers || []).forEach((it: any) => {
    if (it?.name) headers[it.name] = String(it.value || '')
  })
  ;(p.query || []).forEach((it: any) => {
    if (it?.name) query[it.name] = String(it.value || '')
  })
  ;(p.form_fields || []).forEach((it: any) => {
    if (it?.name) form_fields[it.name] = String(it.value || '')
  })
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
