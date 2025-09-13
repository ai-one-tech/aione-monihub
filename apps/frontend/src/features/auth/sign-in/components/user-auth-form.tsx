import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
// 移除第三方登录图标导入
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { authApi, LoginRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z
    .string()
    .min(1, '请输入密码')
    .min(7, '密码至少需要7个字符'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  
  // 检查是否在弹窗中打开
  const isInPopup = window.opener !== null

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    const loginRequest: LoginRequest = {
      username: data.username,
      password: data.password,
    }

    toast.promise(
      authApi.login(loginRequest),
      {
        loading: '登录中...',
        success: (response) => {
          setIsLoading(false)
          const { token, user } = response.data

          // 使用新的setLoginData方法一次性设置用户和token
          const userData = {
            accountNo: user.id,
            email: user.email,
            role: user.roles,
            exp: Date.now() + 24 * 60 * 60 * 1000, // 24小时后过期
          }
          
          auth.setLoginData(token, userData)

          // 如果是在弹窗中，通知父窗口登录成功并关闭当前窗口
          if (isInPopup && window.opener) {
            try {
              window.opener.postMessage(
                { type: 'LOGIN_SUCCESS', user, token },
                window.location.origin
              )
              window.close()
              return `登录成功！窗口即将关闭...`
            } catch (error) {
              console.error('通知父窗口失败:', error)
            }
          }

          // 重定向到存储的位置或默认仪表盘
          const targetPath = redirectTo || '/'
          navigate({ to: targetPath, replace: true })

          return `欢迎回来，${user.username}！`
        },
        error: (error) => {
          setIsLoading(false)
          
          // 处理登录错误
          if (error.response?.status === 401) {
            return '用户名或密码错误'
          } else if (error.response?.status === 400) {
            return '请输入用户名和密码'
          } else {
            return '登录失败，请重试'
          }
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <Input placeholder='请输入用户名' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='请输入密码' {...field} />
              </FormControl>
              <FormMessage />
              {/* <Link
                to='/forgot-password'
                className='text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75'
              >
                忘记密码？
              </Link> */}
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          登录
        </Button>

        {/* 移除第三方登录选项 */}
      </form>
    </Form>
  )
}
