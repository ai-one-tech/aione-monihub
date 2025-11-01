import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, Calendar, Clock, Plus, X } from 'lucide-react'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { useApplicationsProvider } from './applications-provider'
import { useCreateApplication, useUpdateApplication } from '../hooks/use-applications-query'
import { createApplicationRequestSchema, type CreateApplicationRequest, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_OPTIONS } from '../data/api-schema'
import { useDebounce } from '@/hooks/use-debounce'
import { useProjectsQuery, useProjectQuery } from '@/features/projects/hooks/use-projects-query'
import { cn } from '@/lib/utils'

export function ApplicationsEditSheet() {
  const {
    isEditSheetOpen,
    setIsEditSheetOpen,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isViewDialogOpen,
    setIsViewDialogOpen,
    editingApplication,
    viewingApplication,
  } = useApplicationsProvider()

  const createApplicationMutation = useCreateApplication()
  const updateApplicationMutation = useUpdateApplication()

  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>([])
  const [newUser, setNewUser] = useState('')
  const [projectSearch, setProjectSearch] = useState('')
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false)

  const form = useForm<CreateApplicationRequest>({
    resolver: zodResolver(createApplicationRequestSchema),
    defaultValues: {
      project_id: '',
      name: '',
      code: '',
      description: '',
      status: 'active',
      authorization: {
        users: [],
        expiry_date: null,
      },
    },
  })

  const isCreateMode = isCreateSheetOpen
  const isEditMode = isEditSheetOpen

  // 项目搜索相关
  const debouncedProjectSearch = useDebounce(projectSearch)
  const selectedProjectId = form.watch('project_id')
  const { data: selectedProject } = useProjectQuery(selectedProjectId || '')
  const { data: projectsList } = useProjectsQuery({ page: 1, limit: 10, search: debouncedProjectSearch })

  // 当编辑应用时，填充表单数据
  useEffect(() => {
    if (editingApplication && isEditMode) {
      form.reset({
        project_id: editingApplication.project_id,
        name: editingApplication.name,
        code: editingApplication.code,
        description: editingApplication.description,
        status: editingApplication.status,
        authorization: editingApplication.authorization,
      })
      setAuthorizedUsers(editingApplication.authorization.users)
    } else if (isCreateMode) {
      form.reset({
        project_id: '',
        name: '',
        code: '',
        description: '',
        status: 'active',
        authorization: {
          users: [],
          expiry_date: null,
        },
      })
      setAuthorizedUsers([])
    }
  }, [editingApplication, isEditMode, isCreateMode, form])

  // 添加授权用户
  const handleAddUser = () => {
    if (newUser.trim() && !authorizedUsers.includes(newUser.trim())) {
      const updatedUsers = [...authorizedUsers, newUser.trim()]
      setAuthorizedUsers(updatedUsers)
      form.setValue('authorization.users', updatedUsers)
      setNewUser('')
    }
  }

  // 移除授权用户
  const handleRemoveUser = (userToRemove: string) => {
    const updatedUsers = authorizedUsers.filter(user => user !== userToRemove)
    setAuthorizedUsers(updatedUsers)
    form.setValue('authorization.users', updatedUsers)
  }

  const onSubmit = async (data: CreateApplicationRequest) => {
    try {
      const submitData = {
        ...data,
        authorization: {
          ...data.authorization,
          users: authorizedUsers,
        },
      }

      if (isCreateMode) {
        await createApplicationMutation.mutateAsync(submitData)
      } else if (editingApplication) {
        await updateApplicationMutation.mutateAsync({
          applicationId: editingApplication.id,
          data: submitData,
        })
      }
      handleClose()
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  }

  const handleClose = () => {
    setIsEditSheetOpen(false)
    setIsCreateSheetOpen(false)
    form.reset()
    setAuthorizedUsers([])
    setNewUser('')
  }

  const isLoading = createApplicationMutation.isPending || updateApplicationMutation.isPending

  return (
    <>
      {/* 编辑/新增应用抽屉 */}
      <Sheet open={isCreateMode || isEditMode} onOpenChange={handleClose}>
        <SheetContent side='right' className='!w-[500px] !max-w-[500px]'>
          <SheetHeader>
            <SheetTitle>{isCreateMode ? '新增应用' : '编辑应用'}</SheetTitle>
            <SheetDescription>
              {isCreateMode ? '填写应用信息以创建新的应用' : '修改应用信息'}
            </SheetDescription>
          </SheetHeader>

          <div className='px-6 py-4'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                <FormField
                  control={form.control}
                  name='project_id'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>所属项目 *</FormLabel>
                      <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              role='combobox'
                              className={cn('justify-between', !field.value && 'text-muted-foreground')}
                            >
                              {field.value
                                ? (selectedProject
                                    ? `${selectedProject.name} (${selectedProject.code})`
                                    : field.value)
                                : '请选择项目'}
                              <CaretSortIcon className='ms-2 h-4 w-4 shrink-0 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-[320px] p-0'>
                          <Command>
                            <CommandInput
                              placeholder='搜索项目...'
                              onValueChange={setProjectSearch}
                            />
                            <CommandEmpty>未找到项目</CommandEmpty>
                            <CommandGroup>
                              <CommandList>
                                {(projectsList?.data ?? []).map((project) => (
                                  <CommandItem
                                    key={project.id}
                                    value={project.name}
                                    onSelect={() => {
                                      form.setValue('project_id', project.id, { shouldValidate: true })
                                      setProjectPopoverOpen(false)
                                    }}
                                  >
                                    <CheckIcon
                                      className={cn(
                                        'size-4',
                                        field.value === project.id ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    {project.name}（{project.code}）
                                  </CommandItem>
                                ))}
                              </CommandList>
                            </CommandGroup>
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
                      <FormLabel>应用名称 *</FormLabel>
                      <FormControl>
                        <Input placeholder='请输入应用名称' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>应用代码 *</FormLabel>
                      <FormControl>
                        <Input placeholder='请输入应用代码' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>应用状态 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='请选择应用状态' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {APPLICATION_STATUS_OPTIONS.filter(option => option.value !== 'all').map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>应用描述 *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='请输入应用描述'
                          className='min-h-[80px]'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 授权用户管理 */}
                <div className='space-y-3'>
                  <FormLabel>授权用户</FormLabel>
                  
                  {/* 添加用户输入框 */}
                  <div className='flex gap-2'>
                    <Input
                      placeholder='输入用户名'
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddUser()
                        }
                      }}
                    />
                    <Button type='button' onClick={handleAddUser} size='sm'>
                      <Plus className='h-4 w-4' />
                    </Button>
                  </div>

                  {/* 已添加的用户列表 */}
                  {authorizedUsers.length > 0 && (
                    <div className='space-y-2'>
                      <p className='text-sm text-muted-foreground'>已添加用户：</p>
                      <div className='flex flex-wrap gap-2'>
                        {authorizedUsers.map((user, index) => (
                          <Badge key={index} variant='secondary' className='gap-1'>
                            {user}
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='h-auto p-0 text-muted-foreground hover:text-destructive'
                              onClick={() => handleRemoveUser(user)}
                            >
                              <X className='h-3 w-3' />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name='authorization.expiry_date'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>授权过期时间</FormLabel>
                      <FormControl>
                        <Input
                          type='datetime-local'
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end space-x-3 pt-6 mt-8 border-t'>
                  <Button type='button' variant='outline' onClick={handleClose}>
                    取消
                  </Button>
                  <Button type='submit' disabled={isLoading}>
                    {isLoading ? '保存中...' : '保存'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {/* 应用详情抽屉 */}
      <Sheet open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <SheetContent side='right' className='!w-[450px] !max-w-[450px]'>
          <SheetHeader>
            <SheetTitle className='flex items-center gap-2'>
              <Eye className='h-5 w-5' />
              应用详情
            </SheetTitle>
            <SheetDescription>
              查看应用的详细信息
            </SheetDescription>
          </SheetHeader>

          {viewingApplication && (
            <div className='px-6 py-4 space-y-6'>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>应用ID</label>
                <p className='mt-1 text-sm font-mono bg-muted px-2 py-1 rounded'>
                  {viewingApplication.id}
                </p>
              </div>

              <div>
                <label className='text-sm font-medium text-muted-foreground'>所属项目</label>
                <p className='mt-1 text-sm font-mono bg-muted px-2 py-1 rounded'>
                  {viewingApplication.project_id}
                </p>
              </div>

              <div>
                <label className='text-sm font-medium text-muted-foreground'>应用名称</label>
                <p className='mt-1 text-base font-medium'>{viewingApplication.name}</p>
              </div>

              <div>
                <label className='text-sm font-medium text-muted-foreground'>应用代码</label>
                <p className='mt-1 text-sm font-mono bg-muted px-2 py-1 rounded'>
                  {viewingApplication.code}
                </p>
              </div>

              <div>
                <label className='text-sm font-medium text-muted-foreground'>应用描述</label>
                <p className='mt-1 text-sm text-muted-foreground whitespace-pre-wrap'>
                  {viewingApplication.description || '暂无描述'}
                </p>
              </div>

              <div>
                <label className='text-sm font-medium text-muted-foreground'>应用状态</label>
                <div className='mt-1'>
                  <Badge variant={viewingApplication.status === 'active' ? 'default' : 'secondary'}>
                    {APPLICATION_STATUS_LABELS[viewingApplication.status]}
                  </Badge>
                </div>
              </div>

              <div>
                <label className='text-sm font-medium text-muted-foreground'>授权用户</label>
                <div className='mt-1'>
                  {viewingApplication.authorization.users.length > 0 ? (
                    <div className='flex flex-wrap gap-1'>
                      {viewingApplication.authorization.users.map((user, index) => (
                        <Badge key={index} variant='outline'>
                          {user}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground'>无授权用户</p>
                  )}
                </div>
              </div>

              {viewingApplication.authorization.expiry_date && (
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>授权过期时间</label>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {new Date(viewingApplication.authorization.expiry_date).toLocaleString('zh-CN')}
                  </p>
                </div>
              )}

              <Separator />

              <div className='grid grid-cols-1 gap-4'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Calendar className='h-4 w-4' />
                  <span>创建时间：{new Date(viewingApplication.created_at).toLocaleString('zh-CN')}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Clock className='h-4 w-4' />
                  <span>更新时间：{new Date(viewingApplication.updated_at).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}