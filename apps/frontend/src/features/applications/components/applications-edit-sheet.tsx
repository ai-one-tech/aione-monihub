import { useEffect, useState } from 'react'
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
// 移除未使用的 Badge 与 Separator
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandList, CommandItem } from '@/components/ui/command'
import { CheckIcon, CaretSortIcon } from '@radix-ui/react-icons'
import { useApplicationsProvider } from './applications-provider'
import { useCreateApplication, useUpdateApplication, useApplicationQuery } from '../hooks/use-applications-query'
import {
  createApplicationRequestSchema,
  type CreateApplicationRequest,
  APPLICATION_STATUS_OPTIONS,
} from '../data/api-schema'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'
import { useProjectsQuery, useProjectQuery } from '@/features/projects/hooks/use-projects-query'
import { cn } from '@/lib/utils'

export function ApplicationsEditSheet() {
  const {
    isSheetOpen,
    setIsSheetOpen,
    sheetMode,
    selectedApplicationId,
  } = useApplicationsProvider()

  const { data: applicationDetail, isLoading: isLoadingApplication } = useApplicationQuery(selectedApplicationId || '')
  const createApplicationMutation = useCreateApplication()
  const updateApplicationMutation = useUpdateApplication()

  const isCreateMode = sheetMode === 'create'
  const isEditMode = sheetMode === 'edit'
  const isViewMode = sheetMode === 'view'

  const form = useForm<CreateApplicationRequest>({
    resolver: zodResolver(createApplicationRequestSchema),
    defaultValues: {
      project_id: '',
      name: '',
      code: '',
      description: '',
      status: 'active',
    },
    mode: 'onChange',
    reValidateMode: 'onBlur',
  })

  const [projectSearch, setProjectSearch] = useState('')
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false)
  const debouncedProjectSearch = useDebounce(projectSearch)
  const selectedProjectId = form.watch('project_id')
  const { data: selectedProject } = useProjectQuery(selectedProjectId || '')
  const { data: projectsList } = useProjectsQuery({ page: 1, limit: 10, search: debouncedProjectSearch })

  // 将后端返回的状态值归一化为表单允许的字面量类型
  const normalizeStatus = (s: unknown): CreateApplicationRequest['status'] => {
    return s === 'disabled' ? 'disabled' : 'active'
  }

  // 当应用数据加载完成时，更新表单
  useEffect(() => {
    if ((isEditMode || isViewMode) && applicationDetail) {
      // 微任务中重置，避免下拉等绑定的时机问题，并加守卫避免闪烁
      Promise.resolve().then(() => {
        const current = form.getValues()
        const target = {
          project_id: applicationDetail.project_id,
          name: applicationDetail.name,
          code: applicationDetail.code,
          description: applicationDetail.description,
          status: normalizeStatus(applicationDetail.status),
        }
        const needReset = (
          current.project_id !== target.project_id ||
          current.name !== target.name ||
          current.code !== target.code ||
          current.description !== target.description ||
          current.status !== target.status
        )
        if (needReset) {
          form.reset(target)
        }
      })

    } else if (isCreateMode) {
      // 新建模式统一微任务重置并加守卫
      Promise.resolve().then(() => {
        const current = form.getValues()
        const defaults = {
          project_id: '',
          name: '',
          code: '',
          description: '',
          status: 'active',
        }
        const needReset = (
          current.project_id !== defaults.project_id ||
          current.name !== defaults.name ||
          current.code !== defaults.code ||
          current.description !== defaults.description ||
          current.status !== defaults.status
        )
        if (needReset) {
          form.reset(defaults)
        }
      })
    }
  }, [applicationDetail, form, isEditMode, isCreateMode, isViewMode])

  const onSubmit = async (data: CreateApplicationRequest) => {
    try {
      if (isCreateMode) {
        await createApplicationMutation.mutateAsync(data)
        toast.success('应用创建成功')
      } else if (isEditMode && selectedApplicationId) {
        await updateApplicationMutation.mutateAsync({ applicationId: selectedApplicationId, data })
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
    setIsSheetOpen(false)
    form.reset()
  }

  const getSheetTitle = () => {
    if (isCreateMode) return '新增应用'
    if (isEditMode) return '编辑应用'
    return '查看应用'
  }

  const getSheetDescription = () => {
    if (isCreateMode) return '填写应用信息以创建新的应用'
    if (isEditMode) return '修改应用信息'
    return '查看应用详细信息'
  }

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={handleClose}>
        <SheetContent side='right'>
          <SheetHeader>
            <SheetTitle>{getSheetTitle()}</SheetTitle>
            <SheetDescription>
              {getSheetDescription()}
            </SheetDescription>
          </SheetHeader>

          {((isEditMode || isViewMode) && isLoadingApplication) ? (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-sm text-muted-foreground'>加载应用信息中...</div>
            </div>
          ) : (
            <div className='flex-1 overflow-y-auto px-6 py-4'>
              <Form {...form}>
                <form id='application-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                  <FormField
                    control={form.control}
                    name='project_id'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel>所属项目 *</FormLabel>
                        <Popover
                          open={projectPopoverOpen && !isViewMode}
                          onOpenChange={(open) => {
                            if (!isViewMode) {
                              setProjectPopoverOpen(open)
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                role='combobox'
                                disabled={isViewMode}
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
                                disabled={isViewMode}
                              />
                              <CommandEmpty>未找到项目</CommandEmpty>
                              <CommandGroup>
                                <CommandList>
                                  {(projectsList?.data ?? []).map((project) => (
                                    <CommandItem
                                      key={project.id}
                                      value={project.name}
                                      onSelect={() => {
                                        if (!isViewMode) {
                                          form.setValue('project_id', project.id, { shouldValidate: true })
                                          setProjectPopoverOpen(false)
                                        }
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
                          <Input placeholder='请输入应用名称' {...field} disabled={isViewMode} />
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
                          <Input placeholder='请输入应用代码' {...field} disabled={isViewMode} />
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
                        <FormLabel>应用状态 * </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger disabled={isViewMode}>
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
                            disabled={isViewMode}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          )}

          <SheetFooter>
            <div className='flex justify-end space-x-3 w-full'>
              <Button type='button' variant='outline' onClick={handleClose}>
                取消
              </Button>
              {!isViewMode && (
                <Button type='submit' form='application-form' disabled={isLoading || !form.formState.isValid}>
                  {isLoading ? '保存中...' : '保存'}
                </Button>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}