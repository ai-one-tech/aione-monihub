import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSystemUsersContext } from './system-users-provider'
import { systemRoles } from '../data/data'
import { type UpdateUserRequest, type CreateUserRequest } from '../data/api-schema'
import { useUserDetailQuery } from '../hooks/use-user-detail-query'
import { useUpdateUserMutation, useCreateUserMutation } from '../hooks/use-user-mutations'
import { toast } from 'sonner'

// 统一的用户表单schema，支持新增和编辑
const userFormSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  email: z.string().email('请输入有效的邮箱地址'),
  roles: z.array(z.string()).min(1, '请至少选择一个角色'),
  password: z.string().min(6, '密码至少6位').optional(),
})

type UserFormData = z.infer<typeof userFormSchema>



export function SystemUsersEditSheet() {
  const { isUserSheetOpen, setIsUserSheetOpen, userSheetMode, selectedUserId } = useSystemUsersContext()
  
  // 使用React Query hooks
  const { data: userDetail, isLoading: isLoadingUser, error } = useUserDetailQuery(selectedUserId)
  const updateUserMutation = useUpdateUserMutation()
  const createUserMutation = useCreateUserMutation()
  
  const isCreateMode = userSheetMode === 'create'
  const isEditMode = userSheetMode === 'edit'

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      email: '',
      roles: [],
      password: '',
    },
  })

  // 当用户数据加载完成时，更新表单（仅编辑模式）
  useEffect(() => {
    if (isEditMode && userDetail) {
      form.reset({
        username: userDetail.username,
        email: userDetail.email,
        roles: userDetail.roles,
        password: '', // 编辑时密码为空，表示不修改
      })
    } else if (isCreateMode) {
      form.reset({
        username: '',
        email: '',
        roles: [],
        password: '',
      })
    }
  }, [userDetail, form, isEditMode, isCreateMode])

  // 处理错误
  useEffect(() => {
    if (error) {
      console.error('获取用户详情失败:', error)
      toast.error('获取用户详情失败')
    }
  }, [error])

  const onSubmit = async (data: UserFormData) => {
    if (isCreateMode) {
      // 新增用户
      if (!data.password) {
        toast.error('新增用户时密码不能为空')
        return
      }
      
      const createData: CreateUserRequest = {
        username: data.username,
        email: data.email,
        roles: data.roles,
        password: data.password,
      }
      
      createUserMutation.mutate(createData, {
        onSuccess: () => {
          setIsUserSheetOpen(false)
          form.reset()
        },
      })
    } else {
      // 编辑用户
      if (!selectedUserId) {
        toast.error('未选择用户')
        return
      }

      const updateData: UpdateUserRequest = {
        username: data.username,
        email: data.email,
        roles: data.roles,
      }
      
      updateUserMutation.mutate(
        { userId: selectedUserId, userData: updateData },
        {
          onSuccess: () => {
            setIsUserSheetOpen(false)
          },
        }
      )
    }
  }

  return (
    <Sheet open={isUserSheetOpen} onOpenChange={setIsUserSheetOpen}>
      <SheetContent side='right' className='w-[400px] sm:w-[540px]'>
        <SheetHeader>
          <SheetTitle>{isCreateMode ? '新增用户' : '编辑用户'}</SheetTitle>
          <SheetDescription>
            {isCreateMode ? '填写用户信息以创建新的系统用户账户' : '修改用户信息'}
          </SheetDescription>
        </SheetHeader>
        
        {(isEditMode && isLoadingUser) ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-sm text-muted-foreground'>加载用户信息中...</div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 py-4'>
              {/* 用户ID字段 - 仅编辑模式显示且不可编辑 */}
              {isEditMode && selectedUserId && (
                <FormItem>
                  <FormLabel>用户ID</FormLabel>
                  <FormControl>
                    <Input value={selectedUserId} disabled />
                  </FormControl>
                </FormItem>
              )}
              
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
                name='roles'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色（可多选）</FormLabel>
                    <div className='space-y-2'>
                      {systemRoles.map((role) => (
                        <div key={role.value} className='flex items-center space-x-2'>
                          <Checkbox
                            id={role.value}
                            checked={field.value?.includes(role.value) || false}
                            onCheckedChange={(checked) => {
                              const currentRoles = field.value || []
                              if (checked) {
                                field.onChange([...currentRoles, role.value])
                              } else {
                                field.onChange(currentRoles.filter(r => r !== role.value))
                              }
                            }}
                          />
                          <label htmlFor={role.value} className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                            {role.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      密码
                      {isEditMode && <span className='text-sm text-muted-foreground ml-2'>（留空表示不修改）</span>}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={isCreateMode ? '请输入密码' : '留空表示不修改密码'} 
                        type='password' 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <SheetFooter className='flex flex-col gap-2 pt-6'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsUserSheetOpen(false)}
                  className='w-full'
                >
                  取消
                </Button>
                <Button 
                  type='submit' 
                  disabled={isCreateMode ? createUserMutation.isPending : updateUserMutation.isPending} 
                  className='w-full'
                >
                  {isCreateMode 
                    ? (createUserMutation.isPending ? '创建中...' : '创建用户')
                    : (updateUserMutation.isPending ? '保存中...' : '保存更改')
                  }
                </Button>
              </SheetFooter>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  )
}