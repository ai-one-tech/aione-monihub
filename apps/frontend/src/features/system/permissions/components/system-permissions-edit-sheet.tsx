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
  FormDescription,
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
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSystemPermissions } from './system-permissions-provider'
import { type UpdatePermissionRequest, type CreatePermissionRequest } from '../data/api-schema'
import { usePermissionDetailQuery } from '../hooks/use-permission-detail-query'
import { useUpdatePermissionMutation, useCreatePermissionMutation } from '../hooks/use-permission-mutations'
import { toast } from 'sonner'

// 统一的权限表单schema
const permissionFormSchema = z.object({
  name: z.string().min(1, '权限名称不能为空'),
  description: z.string().optional().nullable(),
  action: z.string().min(1, '操作不能为空'),
  permission_type: z.string().min(1, '权限类型不能为空'),
  menu_path: z.string().optional().nullable(),
  menu_icon: z.string().optional().nullable(),
  parent_permission_id: z.string().optional().nullable(),
  sort_order: z.number().optional().nullable(),
  is_hidden: z.boolean().optional().nullable(),
})

type PermissionFormData = z.infer<typeof permissionFormSchema>

export function SystemPermissionsEditSheet() {
  const { 
    isPermissionSheetOpen, 
    setIsPermissionSheetOpen, 
    permissionSheetMode, 
    selectedPermissionId 
  } = useSystemPermissions()
  
  const { data: permissionDetail, isLoading: isLoadingPermission, error } = usePermissionDetailQuery(selectedPermissionId)
  const updatePermissionMutation = useUpdatePermissionMutation()
  const createPermissionMutation = useCreatePermissionMutation()
  
  const isCreateMode = permissionSheetMode === 'create'
  const isEditMode = permissionSheetMode === 'edit'
  const isViewMode = permissionSheetMode === 'view'

  const form = useForm<PermissionFormData>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      name: '',
      description: '',
      action: '',
      permission_type: '',
      menu_path: '',
      menu_icon: '',
      parent_permission_id: '',
      sort_order: null,
      is_hidden: false,
    },
  })

  // 当权限数据加载完成时，更新表单
  useEffect(() => {
    if ((isEditMode || isViewMode) && permissionDetail) {
      form.reset({
        name: permissionDetail.name,
        description: permissionDetail.description || '',
        action: permissionDetail.action,
        permission_type: permissionDetail.permission_type,
        menu_path: permissionDetail.menu_path || '',
        menu_icon: permissionDetail.menu_icon || '',
        parent_permission_id: permissionDetail.parent_permission_id || '',
        sort_order: permissionDetail.sort_order,
        is_hidden: permissionDetail.is_hidden || false,
      })
    } else if (isCreateMode) {
      form.reset({
        name: '',
        description: '',
        action: '',
        permission_type: '',
        menu_path: '',
        menu_icon: '',
        parent_permission_id: '',
        sort_order: null,
        is_hidden: false,
      })
    }
  }, [permissionDetail, form, isEditMode, isCreateMode, isViewMode])

  // 处理错误
  useEffect(() => {
    if (error) {
      console.error('获取权限详情失败:', error)
      toast.error('获取权限详情失败')
    }
  }, [error])

  const onSubmit = async (data: PermissionFormData) => {
    const valid = await form.trigger()
    if (!valid) {
      console.error('权限保存校验失败:', form.formState.errors)
      toast.error('请完善必填项')
      return
    }

    const submitData = {
      name: data.name,
      description: data.description || null,
      action: data.action,
      permission_type: data.permission_type,
      menu_path: data.menu_path || null,
      menu_icon: data.menu_icon || null,
      parent_permission_id: data.parent_permission_id || null,
      sort_order: data.sort_order,
      is_hidden: data.is_hidden || false,
    }

    if (isCreateMode) {
      createPermissionMutation.mutate(submitData as CreatePermissionRequest, {
        onSuccess: () => {
          setIsPermissionSheetOpen(false)
          form.reset()
        },
      })
    } else if (isEditMode) {
      if (!selectedPermissionId) {
        toast.error('未选择权限')
        return
      }

      updatePermissionMutation.mutate(
        { permissionId: selectedPermissionId, permissionData: submitData as UpdatePermissionRequest },
        {
          onSuccess: () => {
            setIsPermissionSheetOpen(false)
          },
        }
      )
    }
  }

  const getSheetTitle = () => {
    if (isCreateMode) return '新增权限'
    if (isEditMode) return '编辑权限'
    return '查看权限'
  }

  const getSheetDescription = () => {
    if (isCreateMode) return '填写权限信息以创建新的系统权限'
    if (isEditMode) return '修改权限信息'
    return '查看权限详细信息'
  }

  return (
    <Sheet open={isPermissionSheetOpen} onOpenChange={setIsPermissionSheetOpen}>
      <SheetContent side='right' className='!w-[500px] !max-w-[500px]'>
        <SheetHeader>
          <SheetTitle>{getSheetTitle()}</SheetTitle>
          <SheetDescription>{getSheetDescription()}</SheetDescription>
        </SheetHeader>
        
        {((isEditMode || isViewMode) && isLoadingPermission) ? (
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-sm text-muted-foreground'>加载权限信息中...</div>
          </div>
        ) : (
          <>
            <div className='flex-1 overflow-y-auto px-6 py-4'>
              <Form {...form}>
                <form id='permission-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                {/* 权限ID字段 - 仅编辑/查看模式显示且不可编辑 */}
                {(isEditMode || isViewMode) && selectedPermissionId && (
                  <FormItem>
                    <FormLabel>权限ID</FormLabel>
                    <FormControl>
                      <Input value={selectedPermissionId} disabled />
                    </FormControl>
                  </FormItem>
                )}
                
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>权限名称</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder='请输入权限名称，如：menu.dashboard' 
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
                      <FormLabel>描述</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='请输入权限描述' 
                          {...field} 
                          value={field.value || ''}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='action'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>操作</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isViewMode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='请选择操作类型' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Read'>读取</SelectItem>
                          <SelectItem value='Create'>创建</SelectItem>
                          <SelectItem value='Update'>更新</SelectItem>
                          <SelectItem value='Delete'>删除</SelectItem>
                          <SelectItem value='Execute'>执行</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='permission_type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>权限类型</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isViewMode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='请选择权限类型' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Menu'>菜单</SelectItem>
                          <SelectItem value='Page'>页面</SelectItem>
                          <SelectItem value='Action'>操作</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='menu_path'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>菜单路径</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder='请输入菜单路径，如：/dashboard' 
                          {...field} 
                          value={field.value || ''}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormDescription>仅菜单类型权限需要填写</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='menu_icon'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>菜单图标</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder='请输入图标名称，如：Home' 
                          {...field} 
                          value={field.value || ''}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormDescription>仅菜单类型权限需要填写</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='sort_order'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>排序</FormLabel>
                      <FormControl>
                        <Input 
                          type='number' 
                          placeholder='请输入排序序号' 
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(value === '' ? null : parseInt(value))
                          }}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='is_hidden'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel>隐藏权限</FormLabel>
                        <FormDescription>
                          勾选后该权限将不会在菜单中显示
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          {!isViewMode && (
            <SheetFooter>
              <div className='flex justify-end space-x-2 w-full'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsPermissionSheetOpen(false)}
                >
                  取消
                </Button>
                <Button 
                  type='submit'
                  form='permission-form'
                  disabled={isCreateMode ? createPermissionMutation.isPending : updatePermissionMutation.isPending}
                >
                  {isCreateMode 
                    ? (createPermissionMutation.isPending ? '创建中...' : '创建权限')
                    : (updatePermissionMutation.isPending ? '保存中...' : '保存更改')
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
