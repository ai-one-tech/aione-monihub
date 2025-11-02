import { useEffect, useMemo, useRef, useState } from 'react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandList, CommandItem } from '@/components/ui/command'
import { CheckIcon, CaretSortIcon } from '@radix-ui/react-icons'
import { useApplicationsProvider } from './applications-provider'
import { useCreateApplication, useUpdateApplication } from '../hooks/use-applications-query'
import {
  createApplicationRequestSchema,
  type CreateApplicationRequest,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_OPTIONS,
} from '../data/api-schema'
import { toast } from 'sonner'
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
    setEditingApplication,
    viewingApplication,
    setViewingApplication,
  } = useApplicationsProvider()

  const createApplicationMutation = useCreateApplication()
  const updateApplicationMutation = useUpdateApplication()

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
      },
    },
    mode: 'onChange',
    reValidateMode: 'onBlur',
  })

  const [newUser, setNewUser] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [projectSearch, setProjectSearch] = useState('')
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false)
  const debouncedProjectSearch = useDebounce(projectSearch)
  const selectedProjectId = form.watch('project_id')
  const { data: selectedProject } = useProjectQuery(selectedProjectId || '')
  const { data: projectsList } = useProjectsQuery({ page: 1, limit: 10, search: debouncedProjectSearch })

  // 当编辑应用时，填充表单数据
  useEffect(() => {
    if (editingApplication && isEditSheetOpen) {
      form.reset({
        project_id: editingApplication.project_id,
        name: editingApplication.name,
        code: editingApplication.code,
        description: editingApplication.description,
        status: editingApplication.status,
        authorization: {
          users: editingApplication.authorization?.users || [],
        },
      })
    } else if (isCreateSheetOpen) {
      form.reset({
        project_id: '',
        name: '',
        code: '',
        description: '',
        status: 'active',
        authorization: { users: [] },
      })
    }
  }, [editingApplication, isEditSheetOpen, isCreateSheetOpen, form])

  const onSubmit = async (data: CreateApplicationRequest) => {
    try {
      const valid = await form.trigger()
      if (!valid) {
        toast.error('请完善必填项')
        return
      }

      const mergedUsers = Array.from(
        new Set((data.authorization?.users || []).map(u => u.trim()).filter(u => u))
      )
      const payload: CreateApplicationRequest = {
        ...data,
        authorization: { users: mergedUsers, expiry_date: data.authorization?.expiry_date || null },
      }

      if (isCreateSheetOpen) {
        await createApplicationMutation.mutateAsync(payload)
        toast.success('应用创建成功')
      } else if (editingApplication) {
        await updateApplicationMutation.mutateAsync({ applicationId: editingApplication.id, data: payload })
        toast.success('应用更新成功')
      }

      handleClose()
    } catch (error) {
      console.error('保存应用失败:', error)
      // 错误处理已在mutation中完成
    }
  }

  const isLoading = createApplicationMutation.isPending || updateApplicationMutation.isPending

  const handleClose = () => {
    setIsEditSheetOpen(false)
    setIsCreateSheetOpen(false)
    setIsViewDialogOpen(false)
    setEditingApplication(null)
    setViewingApplication(null)
    form.reset()
  }

  const handleAddUser = () => {
    const value = (newUser || '').trim()
    if (!value) return

    const current = form.getValues('authorization.users') || []
    const next = Array.from(new Set([...current, value]))
    form.setValue('authorization.users', next, { shouldDirty: true, shouldValidate: true })
    setNewUser('')
    inputRef.current?.focus()
  }

  const handleRemoveUser = (user: string) => {
    const current = form.getValues('authorization.users') || []
    const next = current.filter(u => u !== user)
    form.setValue('authorization.users', next, { shouldDirty: true, shouldValidate: true })
  }

  const isOpen = isCreateSheetOpen || isEditSheetOpen

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side='right'>
          <SheetHeader>
            <SheetTitle>{isCreateSheetOpen ? '新增应用' : '编辑应用'}</SheetTitle>
            <SheetDescription>
              {isCreateSheetOpen ? '填写应用信息以创建新的应用' : '修改应用信息'}
            </SheetDescription>
          </SheetHeader>

          <div className='flex-1 overflow-y-auto px-6 py-4'>
            <Form {...form}>
              <form id='application-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
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
                          className='min-h-[100px]'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>授权用户</FormLabel>
                  <div className='flex gap-2 mt-2'>
                    <Input
                      ref={inputRef}
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                      placeholder='输入用户邮箱并点击添加'
                    />
                    <Button type='button' onClick={handleAddUser} variant='secondary'>添加</Button>
                  </div>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {(form.watch('authorization.users') || []).map(user => (
                      <Badge key={user} variant='secondary' className='flex items-center gap-2'>
                        <span>{user}</span>
                        <Button type='button' variant='ghost' size='sm' onClick={() => handleRemoveUser(user)}>移除</Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </form>
            </Form>
          </div>

          <SheetFooter>
            <div className='flex justify-end space-x-3 w-full'>
              <Button type='button' variant='outline' onClick={handleClose}>
                取消
              </Button>
              <Button type='submit' form='application-form' disabled={isLoading || !form.formState.isValid}>
                {isLoading ? '保存中...' : '保存'}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <SheetContent side='right' className='!w-[450px] !max-w-[450px]'>
          <SheetHeader>
            <SheetTitle>应用详情</SheetTitle>
            <SheetDescription>查看应用的详细信息</SheetDescription>
          </SheetHeader>

          <div className='flex-1 overflow-y-auto px-6 py-4'>
            {viewingApplication && (
            <div className='space-y-6'>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>应用ID</label>
                <p className='mt-1 text-sm font-mono bg-muted px-2 py-1 rounded'>
                  {viewingApplication.id}
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
                <label className='text-sm font-medium text-muted-foreground'>应用状态</label>
                <div className='mt-1'>
                  <Badge variant={viewingApplication.status === 'active' ? 'default' : 'secondary'}>
                    {APPLICATION_STATUS_LABELS[viewingApplication.status]}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>创建时间</label>
                  <p className='mt-1 text-sm'>
                    {new Date(viewingApplication.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>更新时间</label>
                  <p className='mt-1 text-sm'>
                    {new Date(viewingApplication.updated_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}