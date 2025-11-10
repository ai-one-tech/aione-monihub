import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ChevronRight, CheckCircle, Plus } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '@/features/applications/api/applications-api'
import { instancesApi } from '@/features/instances/api/instances-api'
import { useApplicationInstances } from '@/features/applications/hooks/use-application-instances'
import { ConnectInstanceDialog } from './components/connect-instance-dialog'

const route = getRouteApi('/_authenticated/application-tasks')

export function ApplicationTasks() {
  const search = route.useSearch()
  const queryClient = useQueryClient()
  const [selectedInstances, setSelectedInstances] = useState<string[]>([])
  const [taskType, setTaskType] = useState('shell')
  const [shellScript, setShellScript] = useState('')
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)

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
      limit: 20,
    }),
  })

  const instances = instancesData?.data || []
  const tasks = tasksData?.data || []
  
  // 筛选在线实例
  const activeInstances = instances.filter(instance => instance.online_status === 'online')

  const handleInstanceSelect = (instanceId: string) => {
    setSelectedInstances(prev => 
      prev.includes(instanceId) 
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    )
  }

  const handleSelectAll = () => {
    if (selectedInstances.length === activeInstances.length) {
      setSelectedInstances([])
    } else {
      setSelectedInstances(activeInstances.map(instance => instance.id))
    }
  }

  const handleSubmitTask = async () => {
    if (!shellScript.trim() || selectedInstances.length === 0) return
    
    try {
      const taskData = {
        task_name: `Shell任务 - ${new Date().toLocaleString()}`,
        task_type: 'shell',
        target_instances: selectedInstances,
        task_content: {
          script: shellScript,
          timeout: 300,
        },
        priority: 5,
        timeout_seconds: 300,
        retry_count: 1,
      }
      
      await applicationsApi.createTask(taskData)
      
      // 清空表单
      setShellScript('')
      setSelectedInstances([])
      
      // 刷新任务列表
      // 这里可以添加成功提示
    } catch (error) {
      console.error('创建任务失败:', error)
      // 这里可以添加错误提示
    }
  }

  const handleConnectSuccess = () => {
    // 刷新实例列表
    queryClient.invalidateQueries({ queryKey: ['application-instances', search.applicationId] })
  }

  return (
    <Main fixed className="flex flex-col">
      <div className="flex-1 p-2">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            应用：{application?.name}     ID：{application?.id}
          </h1>
          <Separator className="mt-4 mb-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
          {/* 在线实例 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">在线实例</h3>
              <Badge variant="secondary">在线 {activeInstances.length}</Badge>
            </div>
            
            <div className="mb-4 flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedInstances.length === activeInstances.length ? '取消全选' : '全选'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setConnectDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                连接实例
              </Button>
            </div>

            <ScrollArea className="h-[400px] rounded-lg border">
              <div className="p-2 space-y-2">
                {activeInstances.map((instance) => (
                  <div 
                    key={instance.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedInstances.includes(instance.id) 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleInstanceSelect(instance.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedInstances.includes(instance.id) 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {selectedInstances.includes(instance.id) && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {instance.id}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {instance.hostname || '未知主机名'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {instance.public_ip || instance.ip_address || '未知IP'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* 创建任务 */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">创建任务</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">任务类型：</Label>
                <RadioGroup value={taskType} onValueChange={setTaskType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shell" id="shell" />
                    <Label htmlFor="shell" className="text-sm">执行Shell</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="file" />
                    <Label htmlFor="file" className="text-sm">文件管理</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="command" id="command" />
                    <Label htmlFor="command" className="text-sm">用户命令</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Shell脚本：</Label>
                <Textarea
                  placeholder="请输入Shell 脚本"
                  className="min-h-[100px]"
                  value={shellScript}
                  onChange={(e) => setShellScript(e.target.value)}
                />
              </div>

              <Button 
                className="w-full"
                onClick={handleSubmitTask}
                disabled={!shellScript.trim() || selectedInstances.length === 0}
              >
                发起任务
              </Button>
            </div>
          </Card>

          {/* 右侧占位 */}
          <div></div>
        </div>

        {/* 底部三个区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 任务历史 */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">任务历史</h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {task.task_type}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-600 font-medium">
                          {task.target_instances?.length || 0}个实例
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 mb-1">{task.task_name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(task.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* 相关实例 */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">相关实例</h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {instances.slice(0, 5).map((instance) => (
                  <div key={instance.id} className="p-3 rounded-lg border">
                    <div className="text-sm font-medium truncate mb-1">
                      {instance.id}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {instance.hostname || '未知主机名'}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      {instance.public_ip || instance.ip_address || '未知IP'}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs text-green-600">
                        {instance.online_status === 'online' ? '在线' : '离线'}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {new Date(instance.updated_at).toLocaleString()}
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
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">执行结果</h3>
            <div className="rounded-lg border bg-gray-50 p-4 h-[300px] overflow-auto">
              <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
{`billy@BillyMac monihub % ping baidu.com
PING baidu.com (220.181.7.203): 56 data bytes
64 bytes from 220.181.7.203: icmp_seq=0 ttl=50 time=42.997 ms
64 bytes from 220.181.7.203: icmp_seq=1 ttl=50 time=41.868 ms
64 bytes from 220.181.7.203: icmp_seq=2 ttl=50 time=28.041 ms
64 bytes from 220.181.7.203: icmp_seq=3 ttl=50 time=29.259 ms`}
              </pre>
            </div>
          </Card>
        </div>
      </div>

      {/* 连接实例弹窗 */}
      <ConnectInstanceDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        applicationId={search.applicationId || ''}
        onSuccess={handleConnectSuccess}
      />
    </Main>
  )
}