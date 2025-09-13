import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, LogIn } from 'lucide-react'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoginSuccess?: () => void
}

export function LoginDialog({ open, onOpenChange, onLoginSuccess }: LoginDialogProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginWindow, setLoginWindow] = useState<Window | null>(null)

  const handleLogin = () => {
    setIsLoggingIn(true)
    
    // 打开新窗口进行登录
    const loginUrl = '/sign-in' // 登录页面路径
    const windowFeatures = 'width=600,height=700,centerscreen=yes,scrollbars=yes,resizable=yes'
    
    const newWindow = window.open(loginUrl, 'login', windowFeatures)
    setLoginWindow(newWindow)
    
    // 监听窗口关闭或登录完成
    const checkWindow = () => {
      if (newWindow && newWindow.closed) {
        setIsLoggingIn(false)
        setLoginWindow(null)
        
        // 检查登录状态，如果登录成功则关闭弹窗
        checkLoginStatus()
      }
    }
    
    // 定期检查窗口状态
    const interval = setInterval(() => {
      if (newWindow && newWindow.closed) {
        clearInterval(interval)
        checkWindow()
      }
    }, 1000)
    
    // 监听来自登录窗口的消息
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return // 只接受同源的消息
      }
      
      if (event.data.type === 'LOGIN_SUCCESS') {
        // 登录成功
        clearInterval(interval)
        setIsLoggingIn(false)
        setLoginWindow(null)
        
        if (newWindow) {
          newWindow.close()
        }
        
        onOpenChange(false) // 关闭弹窗
        onLoginSuccess?.() // 回调函数
        
        // 移除事件监听器
        window.removeEventListener('message', handleMessage)
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // 清理函数
    setTimeout(() => {
      window.removeEventListener('message', handleMessage)
    }, 5 * 60 * 1000) // 5分钟后自动清理
  }
  
  const checkLoginStatus = async () => {
    try {
      // 这里可以调用API检查登录状态
      // 如果登录成功，触发相应的处理
      
      // 获取当前的auth store状态
      const authStore = (window as any).useAuthStore?.getState?.() || {}
      const token = authStore.auth?.accessToken
      
      if (token) {
        onOpenChange(false)
        onLoginSuccess?.()
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
    }
  }
  
  // 清理窗口引用
  useEffect(() => {
    return () => {
      if (loginWindow && !loginWindow.closed) {
        loginWindow.close()
      }
    }
  }, [loginWindow])
  
  // 监听Dialog关闭，如果有打开的登录窗口则也关闭
  useEffect(() => {
    if (!open && loginWindow && !loginWindow.closed) {
      loginWindow.close()
      setLoginWindow(null)
      setIsLoggingIn(false)
    }
  }, [open, loginWindow])

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            身份验证过期
          </DialogTitle>
          <DialogDescription>
            您的登录会话已过期，请重新登录以继续使用。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="text-sm text-muted-foreground">
            点击下方按钮将在新窗口中打开登录页面，登录完成后本窗口将自动关闭。
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleLogin} 
              disabled={isLoggingIn}
              className="flex-1"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {isLoggingIn ? '正在登录...' : '前往登录'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoggingIn}
            >
              稍后
            </Button>
          </div>
          
          {isLoggingIn && (
            <div className="text-xs text-muted-foreground text-center">
              已打开登录窗口，请在新窗口中完成登录...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}