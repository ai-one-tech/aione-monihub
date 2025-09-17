import { useState, useEffect } from 'react'
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

const editUserSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  firstName: z.string().min(1, '名字不能为空'),
  lastName: z.string().min(1, '姓氏不能为空'),
  email: z.string().email('请输入有效的邮箱地址'),
  phoneNumber: z.string().min(1, '手机号不能为空'),
  role: z.string().min(1, '请选择角色'),
  department: z.string().min(1, '请选择部门'),
  status: z.string().min(1, '请选择状态'),
})

type EditUserFormData = z.infer<typeof editUserSchema>

export function SystemUsersEditDialog() {
  const { isEditDialogOpen, setIsEditDialogOpen, selectedUserId } = useSystemUsersContext()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: '',
      department: '',
      status: '',
    },
  })

  // 当对话框打开且有选中用户时，加载用户数据
  useEffect(() => {
    if (isEditDialogOpen && selectedUserId) {
      // TODO: 从API获取用户详细信息
      // const user = await usersApi.getUserById(selectedUserId)
      // 暂时使用默认值
      form.reset({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: '',
        department: '',
        status: '',
      })
    }
  }, [isEditDialogOpen, selectedUserId, form])

  const onSubmit = async (data: EditUserFormData) => {
    setIsLoading(true)
    try {
      // TODO: 实现更新用户的API调用
      console.log('更新用户:', { id: selectedUserId, ...data })
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('更新用户失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>
            修改用户信息
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>状态</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='选择状态' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='active'>活跃</SelectItem>
                      <SelectItem value='inactive'>非活跃</SelectItem>
                      <SelectItem value='invited'>已邀请</SelectItem>
                      <SelectItem value='suspended'>已暂停</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsEditDialogOpen(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? '保存中...' : '保存更改'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}