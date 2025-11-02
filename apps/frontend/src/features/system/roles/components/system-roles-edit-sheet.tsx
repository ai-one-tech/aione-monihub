import { useEffect, useMemo } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useSystemRolesContext } from './system-roles-provider'
import { useUpdateRoleMutation, useCreateRoleMutation, useRoleQuery } from '../hooks/use-roles-query'
import { usePermissionsQuery } from '../../permissions/hooks/use-permissions-query'
import { roleFormSchema, type RoleFormData } from '../data/api-schema'
import { toast } from 'sonner'

export function SystemRolesEditSheet() {
  const {
    isSheetOpen,
    setIsSheetOpen,
    sheetMode,
    selectedRoleId,
  } = useSystemRolesContext()

  const { data: roleDetail, isLoading: isLoadingRole } = useRoleQuery(selectedRoleId || '')
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissionsQuery({
    page: 1,
    limit: 1000, // 获取所有权限
  })

  const updateRoleMutation = useUpdateRoleMutation()
  const createRoleMutation = useCreateRoleMutation()

  const isCreateMode = sheetMode === 'create'
  const isEditMode = sheetMode === 'edit'
  const isViewMode = sheetMode === 'view'
  
  // 判断是否为管理员角色
  const isAdminRole = useMemo(() => {
    if (!roleDetail?.name) return false
    return roleDetail.name.toLowerCase() === 'admin'
  }, [roleDetail?.name])

  const form = useForm({
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
      form.reset({
        name: roleDetail.name,
        description: roleDetail.description,
        permissions: roleDetail.permissions || [],
      })
    } else if (isCreateMode) {
      form.reset({
        name: '',
        description: '',
        permissions: [],
      })
    }
  }, [roleDetail, form, isEditMode, isCreateMode, isViewMode])

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
  
  // 不为创建模式时显示
  const isVisible = isEditMode || isViewMode
  if (!isVisible) return null

  const onSubmit = async (data: any) => {
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
      } else if (isEditMode && selectedRoleId) {
        await updateRoleMutation.mutateAsync({
          roleId: selectedRoleId,
          data: submitData,
        })
      }
      handleClose()
      form.reset()
    } catch (error) {
      console.error('保存角色失败:', error)
    }
  }

  const handleClose = () => {
    setIsSheetOpen(false)
    form.reset()
  }

  const getSheetTitle = () => {
    if (isCreateMode) return '新增角色'
    if (isEditMode) return '编辑角色'
    return '查看角色'
  }

  const getSheetDescription = () => {
    if (isCreateMode) return '填写角色信息以创建新的角色'
    if (isEditMode) return '修改角色信息和权限设置'
    return '查看角色详细信息'
  }

  const isLoading = createRoleMutation.isPending || updateRoleMutation.isPending
  const isLoadingData = (isEditMode || isViewMode) && (isLoadingRole || isLoadingPermissions)

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleClose}>
      <SheetContent side='right' className='!w-[500px] !max-w-[500px]'>
        <SheetHeader>
          <SheetTitle>{getSheetTitle()}</SheetTitle>
          <SheetDescription>
            {getSheetDescription()}
          </SheetDescription>
        </SheetHeader>

        {isLoadingData ? (
          <div className='flex-1 flex items-center justify-center py-8'>
            <div className='space-y-4 w-full'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          </div>
        ) : (
          <>
            <div className='flex-1 overflow-y-auto px-6 py-4'>
              <Form {...form}>
                <form id='role-form' onSubmit={form.handleSubmit(onSubmit as any)} className='space-y-6'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>角色名称 *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder='请输入角色名称' 
                            {...field}
                            disabled={isViewMode}
                          />
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
                            <div className='border rounded-lg p-4 bg-background'>
                              <ScrollArea className='h-[400px]'>
                                <div className='space-y-4 pr-4'>
                                  {Object.entries(permissionsByType).map(([type, perms]) => (
                                    <div key={type} className='border rounded-md overflow-hidden'>
                                      {/* 分组标题 */}
                                      <div className='bg-muted/50 px-4 py-3 border-b'>
                                        <h4 className='text-sm font-semibold text-foreground'>
                                          {type === 'Menu' ? '菜单' : type === 'Action' ? '操作' : '页面'}
                                        </h4>
                                      </div>
                                      {/* 权限列表 */}
                                      <div className='divide-y'>
                                        {perms.map((perm) => (
                                          <div key={perm.id} className='px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors'>
                                            <Checkbox
                                              id={perm.id}
                                              checked={field.value.includes(perm.id)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  field.onChange([...field.value, perm.id])
                                                } else {
                                                  field.onChange(
                                                    field.value.filter(id => id !== perm.id)
                                                  )
                                                }
                                              }}
                                              disabled={isViewMode}
                                            />
                                            <div className='flex-1'>
                                              <label 
                                                htmlFor={perm.id}
                                                className='text-sm font-medium cursor-pointer leading-tight'
                                              >
                                                {perm.name}
                                              </label>
                                              {perm.description && (
                                                <p className='text-xs text-muted-foreground mt-0.5'>
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
                    form='role-form' 
                    disabled={isLoading || !form.formState.isValid}
                  >
                    {isLoading ? '保存中...' : '保存'}
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
