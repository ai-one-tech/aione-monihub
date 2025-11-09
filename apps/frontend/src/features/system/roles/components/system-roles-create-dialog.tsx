import { useMemo, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Check } from 'lucide-react'
import { useSystemRolesContext } from './system-roles-provider'
import { useCreateRoleMutation, useUpdateRoleMutation, useRoleQuery } from '../hooks/use-roles-query'
import { usePermissionsQuery } from '../../permissions/hooks/use-permissions-query'
import { roleFormSchema, type RoleFormData } from '../data/api-schema'
import { toast } from 'sonner'

export function SystemRolesCreateDialog() {
  const { isSheetOpen, setIsSheetOpen, sheetMode, selectedRoleId } = useSystemRolesContext()
  const createRoleMutation = useCreateRoleMutation()
  const updateRoleMutation = useUpdateRoleMutation()
  const { data: roleDetail, isLoading: isLoadingRole } = useRoleQuery(selectedRoleId || '')
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissionsQuery({
    page: 1,
    limit: 1000, // 获取所有权限
  })
  const initializedRoleIdRef = useRef<string | null>(null)
  
  const isCreateMode = sheetMode === 'create'
  const isEditMode = sheetMode === 'edit'
  const isViewMode = sheetMode === 'view'

  // 当sheet打开状态或选中的角色ID变化时，重置初始化标记
  // 这样确保每次打开编辑sheet时都能重新加载表单数据
  useEffect(() => {
    if (!isSheetOpen || !selectedRoleId) {
      initializedRoleIdRef.current = null
    }
  }, [isSheetOpen, selectedRoleId])

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  })

  // 当角色数据加载完成时，更新表单
  useEffect(() => {
    if ((isEditMode || isViewMode) && roleDetail) {
      // 使用 useRef 追踪已初始化的角色ID，避免重复初始化
      if (initializedRoleIdRef.current === roleDetail.id) {
        return
      }
      initializedRoleIdRef.current = roleDetail.id
      
      // 使用微任务队列延迟设置值
      Promise.resolve().then(() => {
        form.setValue('name', roleDetail.name)
        form.setValue('description', roleDetail.description)
        form.setValue('permissions', roleDetail.permissions || [])
      })
    } else if (isCreateMode) {
      initializedRoleIdRef.current = null
      form.reset({
        name: '',
        description: '',
        permissions: [],
      })
    }
  }, [roleDetail, isEditMode, isCreateMode, isViewMode, form])

  // 判断是否为管理员角色
  const isAdminRole = useMemo(() => {
    const roleName = form.watch('name')
    if (!roleName) return false
    return roleName.toLowerCase() === 'admin'
  }, [form.watch('name')])

  const onSubmit = async (data: RoleFormData) => {
    try {
      const valid = await form.trigger()
      if (!valid) {
        toast.error('请完善必填项')
        return
      }

      // 管理员不需要权限设置
      const submitData: RoleFormData = {
        ...data,
        permissions: isAdminRole ? [] : data.permissions,
      }

      if (isCreateMode) {
        await createRoleMutation.mutateAsync(submitData)
      } else if (isEditMode) {
        if (!selectedRoleId) {
          toast.error('未选择角色')
          return
        }
        await updateRoleMutation.mutateAsync({
          roleId: selectedRoleId,
          data: submitData,
        })
      }
      
      setIsSheetOpen(false)
      form.reset()
    } catch (error) {
      console.error(isCreateMode ? '创建角色失败:' : '更新角色失败:', error)
    }
  }

  const handleClose = () => {
    setIsSheetOpen(false)
    form.reset()
  }

  const permissionsList = permissionsData?.data || []

  // 按权限类型分组
  const permissionsByType = useMemo(() => {
    const grouped: Record<string, typeof permissionsList> = {}
    permissionsList.forEach(perm => {
      if (!grouped[perm.permission_type]) {
        grouped[perm.permission_type] = []
      }
      grouped[perm.permission_type].push(perm)
    })
    return grouped
  }, [permissionsList])

  const isLoading = isCreateMode ? createRoleMutation.isPending : updateRoleMutation.isPending

  const getSheetTitle = () => {
    if (isCreateMode) return '新增角色'
    if (isEditMode) return '编辑角色'
    return '查看角色'
  }

  const getSheetDescription = () => {
    if (isCreateMode) return '填写角色信息以创建新的角色'
    if (isEditMode) return '修改角色信息'
    return '查看角色详细信息'
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleClose}>
      <SheetContent side='right' className='!w-[1000px] !max-w-[1000px]'>
        <SheetHeader className='px-6 pt-6'>
          <SheetTitle>{getSheetTitle()}</SheetTitle>
          <SheetDescription>
            {getSheetDescription()}
          </SheetDescription>
        </SheetHeader>

        {((isEditMode || isViewMode) && isLoadingRole) ? (
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-sm text-muted-foreground'>加载角色信息中...</div>
          </div>
        ) : (
          <>
            <div className='flex flex-col flex-1 min-h-0 px-6 py-4'>
              <Form {...form}>
                <form id='create-role-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 flex flex-col flex-1 min-h-0 overflow-y-auto'>
                  {/* 角色ID字段 - 仅编辑/查看模式显示且不可编辑 */}
                  {(isEditMode || isViewMode) && selectedRoleId && (
                    <FormItem>
                      <FormLabel>角色ID</FormLabel>
                      <FormControl>
                        <Input value={selectedRoleId} disabled />
                      </FormControl>
                    </FormItem>
                  )}
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>角色名称 *</FormLabel>
                        <FormControl>
                          <Input placeholder='请输入角色名称' {...field} disabled={isViewMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>角色描述 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='请输入角色描述'
                            className='min-h-[100px]'
                            {...field}
                            disabled={isViewMode}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 仅当不是管理员角色时显示权限选择 */}
                  {!isAdminRole && (
                    <FormField
                      control={form.control}
                      name='permissions'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>关联权限</FormLabel>
                          <FormDescription>
                            为该角色分配相应的权限
                          </FormDescription>
                          {isLoadingPermissions ? (
                            <div className='space-y-2'>
                              <Skeleton className='h-6 w-full' />
                              <Skeleton className='h-6 w-full' />
                              <Skeleton className='h-6 w-full' />
                            </div>
                          ) : (
                            <div className='border rounded-md p-4 flex flex-col flex-1 min-h-0'>
                              <ScrollArea className='flex-1 min-h-0'>
                                <div className='space-y-4 pr-4'>
                                  {Object.entries(permissionsByType).map(([type, perms]) => (
                                    <div key={type}>
                                      <h4 className='text-sm font-semibold mb-3 text-muted-foreground'>
                                        {type === 'Menu' ? '菜单' : type === 'Action' ? '操作' : '页面'}
                                      </h4>
                                      <div className='space-y-3 space-x-3 ml-2 flex flex-row flex-wrap'>
                                        {perms.map((perm) => (
                                          <div
                                            key={perm.id}
                                            className={`w-[31%] flex items-center space-x-2 ${!isViewMode && 'cursor-pointer'} p-1 rounded-md border-2 transition-colors ${
                                              field.value.includes(perm.id)
                                                ? 'bg-primary/5 border-primary hover:bg-primary/10'
                                                : 'border-transparent hover:bg-gray-50'
                                            }`}
                                            onClick={() => {
                                              if (isViewMode) return
                                              const newValues = field.value.includes(perm.id)
                                                ? field.value.filter(id => id !== perm.id)
                                                : [...field.value, perm.id]
                                              field.onChange(newValues)
                                            }}
                                          >
                                            <div className={`h-4 w-4 rounded-sm border-2 flex items-center justify-center ${
                                              field.value.includes(perm.id) 
                                                ? 'bg-primary border-primary' 
                                                : 'border-muted-foreground/30'
                                            }`}>
                                              {field.value.includes(perm.id) && (
                                                <Check className='h-3 w-3 text-primary-foreground' />
                                              )}
                                            </div>
                                            <div className='flex-1'>
                                              <span className={`text-sm font-medium leading-none ${!isViewMode && 'cursor-pointer'}`}>
                                                {perm.name}
                                              </span>
                                              {perm.description && (
                                                <p className='text-xs text-muted-foreground mt-1'>
                                                  {perm.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* 当是管理员角色时，显示提示信息 */}
                  {isAdminRole && (
                    <div className='rounded-md bg-blue-50 p-4 text-sm text-blue-800 border border-blue-200'>
                      <p className='font-medium'>管理员角色</p>
                      <p className='mt-1 text-xs'>
                        管理员角色默认拥有所有权限，无需设置。
                      </p>
                    </div>
                  )}
                </form>
              </Form>
            </div>

            {!isViewMode && (
              <SheetFooter>
                <div className='flex justify-end space-x-3 w-full'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    取消
                  </Button>
                  <Button
                    type='submit'
                    form='create-role-form'
                    disabled={isLoading}
                  >
                    {isCreateMode 
                      ? (isLoading ? '创建中...' : '创建')
                      : (isLoading ? '保存中...' : '保存更改')
                    }
                  </Button>
                </div>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
