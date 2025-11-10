import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Server, Link } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { instancesApi } from '@/features/instances/api/instances-api'

interface ConnectInstanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  applicationId?: string
}

export function ConnectInstanceDialog({
  open,
  onOpenChange,
  onSuccess,
  applicationId,
}: ConnectInstanceDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    hostname: '',
    ip_address: '',
    port: 22,
    username: '',
    auth_type: 'password' as 'password' | 'key',
    password: '',
    private_key: '',
    application_id: applicationId || '',
  })
  const [error, setError] = useState('')

  // 在外部 applicationId 变化时同步到表单
  // 这样从应用列表跳转过来会自动携带应用ID
  // 如果不传则用户可以自行填写
  // 不影响后端接口的可选性
  // 
  // 注意：当 applicationId 存在时，我们在输入框中禁用编辑，避免误改
  // 用户若需修改可从应用任务页清空后再编辑
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  
  // 这里不依赖 formData 以避免循环更新
  // 仅在 applicationId 改变时覆盖表单的 application_id
  
  // v1: 使用简单同步
  
  // NOTE: TanStack Router 路由跳转会触发组件重新渲染
  // 因此初始化同步通常足够，但这里也稳妥地添加一次同步逻辑
  
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      application_id: applicationId || '',
    }))
  }, [applicationId])

  const connectMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name,
        hostname: data.hostname,
        ip_address: data.ip_address,
        port: data.port,
        username: data.username,
        auth_type: data.auth_type,
        auth_credentials: data.auth_type === 'password' 
          ? { password: data.password }
          : { private_key: data.private_key },
        application_id: data.application_id || undefined,
      }
      
      return instancesApi.createInstance(payload)
    },
    onSuccess: () => {
      setError('')
      onOpenChange(false)
      onSuccess?.()
      // 重置表单
      setFormData({
        name: '',
        hostname: '',
        ip_address: '',
        port: 22,
        username: '',
        auth_type: 'password',
        password: '',
        private_key: '',
        application_id: '',
      })
    },
    onError: (error: any) => {
      setError(error.message || '连接实例失败，请检查配置信息')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 基础验证
    if (!formData.name.trim()) {
      setError('请输入实例名称')
      return
    }
    if (!formData.hostname.trim() && !formData.ip_address.trim()) {
      setError('请输入主机名或IP地址')
      return
    }
    if (!formData.username.trim()) {
      setError('请输入用户名')
      return
    }
    if (formData.auth_type === 'password' && !formData.password.trim()) {
      setError('请输入密码')
      return
    }
    if (formData.auth_type === 'key' && !formData.private_key.trim()) {
      setError('请输入私钥')
      return
    }

    connectMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            连接实例
          </DialogTitle>
          <DialogDescription>
            添加新的实例到系统中，支持SSH连接和认证
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">实例名称 *</Label>
              <Input
                id="name"
                placeholder="例如：Web服务器-01"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={connectMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="application_id">应用ID</Label>
              <Input
                id="application_id"
                placeholder="可选"
                value={formData.application_id}
                onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
                disabled={connectMutation.isPending || !!applicationId}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hostname">主机名</Label>
              <Input
                id="hostname"
                placeholder="例如：server.example.com"
                value={formData.hostname}
                onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                disabled={connectMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip_address">IP地址</Label>
              <Input
                id="ip_address"
                placeholder="例如：192.168.1.100"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                disabled={connectMutation.isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="port">端口</Label>
              <Input
                id="port"
                type="number"
                placeholder="22"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 22 })}
                disabled={connectMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">用户名 *</Label>
              <Input
                id="username"
                placeholder="例如：root"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={connectMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth_type">认证方式</Label>
            <Select
              value={formData.auth_type}
              onValueChange={(value: 'password' | 'key') => 
                setFormData({ ...formData, auth_type: value })
              }
              disabled={connectMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="password">密码认证</SelectItem>
                <SelectItem value="key">私钥认证</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.auth_type === 'password' ? (
            <div className="space-y-2">
              <Label htmlFor="password">密码 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={connectMutation.isPending}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="private_key">私钥 *</Label>
              <textarea
                id="private_key"
                placeholder="请输入私钥内容"
                className="w-full h-32 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                value={formData.private_key}
                onChange={(e) => setFormData({ ...formData, private_key: e.target.value })}
                disabled={connectMutation.isPending}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={connectMutation.isPending}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  连接中...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  连接
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}