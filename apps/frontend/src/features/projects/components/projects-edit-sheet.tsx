import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, Calendar, Clock } from 'lucide-react'
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
import { useProjectsContext } from './projects-provider'
import { useCreateProjectMutation, useUpdateProjectMutation, useProjectQuery } from '../hooks/use-projects-query'
import { createProjectRequestSchema, type CreateProjectRequest, PROJECT_STATUS_LABELS, PROJECT_STATUS_OPTIONS } from '../data/api-schema'
import { toast } from 'sonner'

export function ProjectsEditSheet() {
  const {
    isSheetOpen,
    setIsSheetOpen,
    sheetMode,
    selectedProjectId,
  } = useProjectsContext()

  const { data: projectDetail, isLoading: isLoadingProject } = useProjectQuery(selectedProjectId || '')
  const createProjectMutation = useCreateProjectMutation()
  const updateProjectMutation = useUpdateProjectMutation()

  const isCreateMode = sheetMode === 'create'
  const isEditMode = sheetMode === 'edit'
  const isViewMode = sheetMode === 'view'

  const form = useForm<CreateProjectRequest>({
    resolver: zodResolver(createProjectRequestSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: 'active',
    },
    mode: 'onChange',
    reValidateMode: 'onBlur',
  })

  // 当项目数据加载完成时，更新表单
  useEffect(() => {
    if ((isEditMode || isViewMode) && projectDetail) {
      form.reset({
        name: projectDetail.name,
        code: projectDetail.code,
        description: projectDetail.description,
        status: projectDetail.status,
      })
    } else if (isCreateMode) {
      form.reset({
        name: '',
        code: '',
        description: '',
        status: 'active',
      })
    }
  }, [projectDetail, form, isEditMode, isCreateMode, isViewMode])

  const onSubmit = async (data: CreateProjectRequest) => {
    try {
      const valid = await form.trigger()
      if (!valid) {
        toast.error('请完善必填项')
        return
      }

      if (isCreateMode) {
        await createProjectMutation.mutateAsync(data)
      } else if (isEditMode && selectedProjectId) {
        await updateProjectMutation.mutateAsync({
          id: selectedProjectId,
          data,
        })
      }
      handleClose()
      form.reset()
    } catch (error) {
      console.error('保存项目失败:', error)
      // 错误处理已在mutation中完成
    }
  }

  const handleClose = () => {
    setIsSheetOpen(false)
    form.reset()
  }

  const getSheetTitle = () => {
    if (isCreateMode) return '新增项目'
    if (isEditMode) return '编辑项目'
    return '查看项目'
  }

  const getSheetDescription = () => {
    if (isCreateMode) return '填写项目信息以创建新的项目'
    if (isEditMode) return '修改项目信息'
    return '查看项目详细信息'
  }

  const isLoading = createProjectMutation.isPending || updateProjectMutation.isPending

  return (
    <>
      {/* 编辑/新增/查看项目抽屉 */}
      <Sheet open={isSheetOpen} onOpenChange={handleClose}>
        <SheetContent side='right'>
          <SheetHeader className='px-6 pt-6'>
          <SheetTitle>{getSheetTitle()}</SheetTitle>
          <SheetDescription>
            {getSheetDescription()}
          </SheetDescription>
          </SheetHeader>

          {((isEditMode || isViewMode) && isLoadingProject) ? (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-sm text-muted-foreground'>加载项目信息中...</div>
            </div>
          ) : (
          <div className='flex-1 overflow-y-auto px-6 py-4'>
            <Form {...form}>
              <form id='project-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>项目名称 *</FormLabel>
                      <FormControl>
                        <Input placeholder='请输入项目名称' {...field} />
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
                      <FormLabel>项目代码 *</FormLabel>
                      <FormControl>
                        <Input placeholder='请输入项目代码' {...field} />
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
                      <FormLabel>项目状态 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='请选择项目状态' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROJECT_STATUS_OPTIONS.filter(option => option.value !== 'all').map((option) => (
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
                      <FormLabel>项目描述 *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='请输入项目描述'
                          className='min-h-[100px]'
                          {...field}
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
                <Button type='submit' form='project-form' disabled={isLoading || !form.formState.isValid}>
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