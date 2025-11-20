import { useEffect, useRef, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSystemPermissions } from './system-permissions-provider'
import { type UpdatePermissionRequest, type CreatePermissionRequest } from '../data/api-schema'
import { ACTION_MAP, PERMISSION_TYPE_MAP } from '../data/permission-enums'
import { usePermissionDetailQuery } from '../hooks/use-permission-detail-query'
import { useUpdatePermissionMutation, useCreatePermissionMutation } from '../hooks/use-permission-mutations'
import { usePermissionsQuery } from '../hooks/use-permissions-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'

// 统一的权限表单schema
const permissionFormSchema = z.object({
  name: z.string().min(1, '权限名称不能为空'),
  description: z.string().optional().nullable(),
  action: z.string().optional().nullable(),
  permission_type: z.string().min(1, '权限类型不能为空'),
  menu_path: z.string().optional().nullable(),
  menu_icon: z.string().optional().nullable(),
  parent_permission_id: z.string().min(1, '父级权限不能为空'),
  sort_order: z.number().optional().nullable(),
  is_hidden: z.boolean().optional().nullable(),
}).refine(
  (data) => {
    // 如果权限类型是 Action，则操作类型必填
    if (data.permission_type === 'action') {
      return data.action && data.action.length > 0
    }
    // 其他类型操作类型可以为空
    return true
  },
  {
    message: '当权限类型为操作时，操作类型不能为空',
    path: ['action'],
  }
)

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
  const initializedPermissionIdRef = useRef<string | null>(null)
  const [parentOpen, setParentOpen] = useState(false)
  
  const isCreateMode = permissionSheetMode === 'create'
  const isEditMode = permissionSheetMode === 'edit'
  const isViewMode = permissionSheetMode === 'view'

  const form = useForm<PermissionFormData>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      name: '',
      description: '',
      action: null,
      permission_type: '',
      menu_path: null,
      menu_icon: '',
      parent_permission_id: '',
      sort_order: null,
      is_hidden: false,
    },
  })

  // 当权限数据加载完成时，更新表单
  useEffect(() => {
    if ((isEditMode || isViewMode) && permissionDetail) {
      // 使用 useRef 追踪已初始化的权限ID，避免重复初始化
      if (initializedPermissionIdRef.current === permissionDetail.id) {
        return
      }
      initializedPermissionIdRef.current = permissionDetail.id
      
      // 使用微任务队列延迟设置值，确保Select选项已经渲染
      Promise.resolve().then(() => {
        form.setValue('name', permissionDetail.name)
        form.setValue('description', permissionDetail.description || '')
        // 兼容后端 snake_case，回填 UI 直接用原值
        form.setValue('action', permissionDetail.action || '')
        form.setValue('permission_type', permissionDetail.permission_type || '')
        form.setValue('menu_path', permissionDetail.menu_path || '')
        form.setValue('menu_icon', permissionDetail.menu_icon || '')
        form.setValue('parent_permission_id', permissionDetail.parent_permission_id || '')
        form.setValue('sort_order', permissionDetail.sort_order)
        form.setValue('is_hidden', permissionDetail.is_hidden || false)
      })
    } else if (isCreateMode) {
      initializedPermissionIdRef.current = null
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
  }, [permissionDetail, isEditMode, isCreateMode, isViewMode, form])

  // 处理错误
  useEffect(() => {
    if (error) {
      console.error('获取权限详情失败:', error)
      toast.error('获取权限详情失败')
    }
  }, [error])

  // 监听权限类型变化，如果不是 Action，则清空操作类型
  useEffect(() => {
    const permissionType = form.watch('permission_type')
    if (permissionType !== 'action') {
      form.setValue('action', '')
    }
  }, [form.watch('permission_type'), form])

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
      // 将操作类型转换为后端枚举格式 snake_case
      action: data.action ? data.action.toLowerCase() : '',
      permission_type: data.permission_type,
      menu_path: data.menu_path || null,
      menu_icon: data.menu_icon || null,
      parent_permission_id: data.parent_permission_id,
      sort_order: data.sort_order,
      is_hidden: data.is_hidden || false,
    }

    if (submitData.permission_type !== 'action') {
      // 非操作类型不传动作，兼容后端允许空
      submitData.action = ''
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

  const { data: permissionsList } = usePermissionsQuery({ limit: 1000 })
  const allPermissions = permissionsList?.data || []
  const selectedParent = allPermissions.find(p => p.id === form.watch('parent_permission_id'))

  return (
    <Sheet open={isPermissionSheetOpen} onOpenChange={setIsPermissionSheetOpen}>
      <SheetContent side='right' className='!w-[500px] !max-w-[500px]'>
        <SheetHeader className='px-6 pt-6'>
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
                  name='parent_permission_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>父级权限</FormLabel>
                      <Popover open={parentOpen} onOpenChange={setParentOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type='button'
                            role='combobox'
                            className={`${buttonVariants({ variant: 'outline' })} w-full justify-between`}
                            disabled={isViewMode}
                          >
                            {selectedParent ? `${selectedParent.name}${selectedParent.description ? `（${selectedParent.description}）` : ''}` : '请选择父级权限'}
                            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className='w-[400px] p-0'>
                          <Command>
                            <CommandInput placeholder='搜索名称或描述' />
                            <CommandList>
                              <CommandEmpty>无匹配项</CommandEmpty>
                              <CommandGroup>
                                {allPermissions.map((p) => (
                                  <CommandItem
                                    key={p.id}
                                    value={`${p.name} ${p.description ?? ''}`}
                                    onSelect={() => {
                                      field.onChange(p.id)
                                      setParentOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${p.id === field.value ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                    <span className='truncate'>{p.name}</span>
                                    {p.description && (
                                      <span className='ml-2 text-muted-foreground truncate'>（{p.description}）</span>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name='permission_type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>权限类型</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                        disabled={isViewMode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='请选择权限类型' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PERMISSION_TYPE_MAP).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('permission_type') === 'action' && (
                  <FormField
                    control={form.control}
                    name='action'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>操作类型</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ''}
                          disabled={isViewMode}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='请选择操作类型' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ACTION_MAP).map(([key, value]) => (
                              <SelectItem key={key} value={key}>
                                {value.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
