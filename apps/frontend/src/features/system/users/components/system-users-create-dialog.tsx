import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSystemUsersContext } from './system-users-provider'
import { systemRoles, departments } from '../data/data'

const createUserSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  firstName: z.string().min(1, '名字不能为空'),
  lastName: z.string().min(1, '姓氏不能为空'),
  email: z.string().email('请输入有效的邮箱地址'),
  phoneNumber: z.string().min(1, '手机号不能为空'),
  role: z.string().min(1, '请选择角色'),
  department: z.string().min(1, '请选择部门'),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

export function SystemUsersCreateDialog() {
  const { isCreateDialogOpen, setIsCreateDialogOpen } = useSystemUsersContext()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: '',
      department: '',
    },
  })

  const onSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true)
    try {
      // TODO: 实现创建用户的API调用
      console.log('创建用户:', data)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsCreateDialogOpen(false)
      form.reset()
    } catch (error) {
      console.error('创建用户失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>新增用户</DialogTitle>
          <DialogDescription>
            填写用户信息以创建新的系统用户账户
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名字</FormLabel>
                    <FormControl>
                      <Input placeholder='请输入名字' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓氏</FormLabel>
                    <FormControl>
                      <Input placeholder='请输入姓氏' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder='请输入邮箱' type='email' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phoneNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号</FormLabel>
                  <FormControl>
                    <Input placeholder='请输入手机号' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择角色' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {systemRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='department'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>部门</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择部门' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsCreateDialogOpen(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? '创建中...' : '创建用户'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}