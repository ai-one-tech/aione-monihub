import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
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
import { type UpdateUserRequest, type CreateUserRequest } from '../data/api-schema'
import { useUserDetailQuery } from '../hooks/use-user-detail-query'
import { useUpdateUserMutation, useCreateUserMutation } from '../hooks/use-user-mutations'
import { toast } from 'sonner'
import { useRolesQuery } from '@/features/system/roles/hooks/use-roles-query'

// 统一的用户表单schema，支持新增和编辑
const createUserFormSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  email: z.string().email('请输入有效的邮箱地址'),
  roles: z.array(z.string()).min(1, '请至少选择一个角色'),
  password: z.string().min(6, '密码至少6位'),
  status: z.string(),
})

const editUserFormSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  email: z.string().email('请输入有效的邮箱地址'),
  roles: z.array(z.string()).min(1, '请至少选择一个角色'),
  password: z.string().optional(),
  status: z.string(),
})

type UserFormData = z.infer<typeof createUserFormSchema> | z.infer<typeof editUserFormSchema>



export function SystemUsersEditSheet() {
  const { isUserSheetOpen, setIsUserSheetOpen, userSheetMode, selectedUserId } = useSystemUsersContext()
  
  // 使用React Query hooks
  const { data: userDetail, isLoading: isLoadingUser, error } = useUserDetailQuery(selectedUserId)
  const updateUserMutation = useUpdateUserMutation()
  const createUserMutation = useCreateUserMutation()
  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useRolesQuery({})
  
  const isCreateMode = userSheetMode === 'create'
  const isEditMode = userSheetMode === 'edit'

  const form = useForm<UserFormData>({
    resolver: zodResolver(isCreateMode ? createUserFormSchema : editUserFormSchema),
    defaultValues: {
      username: '',
      email: '',
      roles: [],
      password: '',
      status: 'active',
    },
  })

  // 当用户数据加载完成时，更新表单（仅编辑模式）
  useEffect(() => {
    if (isEditMode && userDetail) {
      // 后端返回的 roles 可能是对象数组({ name, description })，统一转换为名称字符串数组
      const roleNames = Array.isArray(userDetail.roles)
        ? (userDetail.roles as any[]).map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
        : []

      form.reset({
        username: userDetail.username,
        email: userDetail.email,
        roles: roleNames,
        password: '', // 编辑时密码为空，表示不修改
        status: userDetail.status || 'active',
      })
    } else if (isCreateMode) {
      form.reset({
        username: '',
        email: '',
        roles: [],
        password: '',
        status: 'active',
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

  useEffect(() => {
    if (rolesError) {
      console.error('获取角色列表失败:', rolesError)
      toast.error('获取角色列表失败')
    }
  }, [rolesError])

  const onSubmit = async (data: UserFormData) => {
    // 显式触发表单校验，避免静默失败
    const valid = await form.trigger()
    if (!valid) {
      console.error('用户保存校验失败:', form.formState.errors)
      toast.error('请完善必填项')
      return
    }

    console.log('提交用户保存:', data)
    if (isCreateMode) {
      // 新增用户
      if (!('password' in data) || !data.password) {
        toast.error('新增用户时密码不能为空')
        return
      }
      
      const createData: CreateUserRequest = {
        username: data.username,
        email: data.email,
        roles: data.roles,
        password: (data as any).password,
        status: (data as any).status,
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
        status: (data as any).status,
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
      <SheetContent side='right' className='!w-[450px] !max-w-[450px]'>
        <SheetHeader className='px-6 pt-6'>
          <SheetTitle>{isCreateMode ? '新增用户' : '编辑用户'}</SheetTitle>
          <SheetDescription>
            {isCreateMode ? '填写用户信息以创建新的系统用户账户' : '修改用户信息'}
          </SheetDescription>
        </SheetHeader>
        
        {(isEditMode && isLoadingUser) ? (
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-sm text-muted-foreground'>加载用户信息中...</div>
          </div>
        ) : (
          <>
            <div className='flex-1 overflow-y-auto px-6 py-4'>
              <Form {...form}>
                <form id='user-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
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

              {/* 状态选择 */}
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>状态</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value as string}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='请选择用户状态' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='active'>激活</SelectItem>
                        <SelectItem value='disabled'>禁用</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='roles'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色</FormLabel>
                    {rolesLoading ? (
                      <div className='text-sm text-muted-foreground'>角色列表加载中...</div>
                    ) : (
                      <div className='grid grid-cols-2 gap-2'>
                        {(rolesData?.data ?? []).map((role) => (
                          <label key={role.name} className='flex items-center space-x-2'>
                            <Checkbox
                              checked={(field.value as string[]).includes(role.name)}
                              onCheckedChange={(checked) => {
                                const current = new Set(field.value as string[])
                                if (checked) {
                                  current.add(role.name)
                                } else {
                                  current.delete(role.name)
                                }
                                field.onChange(Array.from(current))
                              }}
                            />
                            <span>{role.name}</span>
                          </label>
                        ))}
                        {(!rolesData?.data || rolesData.data.length === 0) && (
                          <div className='text-sm text-muted-foreground'>暂无角色可选</div>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 密码 - 仅新增时显示 */}
              {isCreateMode && (
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密码</FormLabel>
                      <FormControl>
                        <Input placeholder='请输入密码' type='password' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>

        <SheetFooter>
          <div className='flex justify-end space-x-2 w-full'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsUserSheetOpen(false)}
            >
              取消
            </Button>
            <Button 
              type='submit'
              form='user-form'
              disabled={isCreateMode ? createUserMutation.isPending : updateUserMutation.isPending}
            >
              {isCreateMode 
                ? (createUserMutation.isPending ? '创建中...' : '创建用户')
                : (updateUserMutation.isPending ? '保存中...' : '保存更改')
              }
            </Button>
          </div>
        </SheetFooter>
      </>
    )}
      </SheetContent>
    </Sheet>
  )
}