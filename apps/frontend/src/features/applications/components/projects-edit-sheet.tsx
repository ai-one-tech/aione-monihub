import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, Calendar, Clock } from 'lucide-react'
import { useEffect } from 'react'
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
import { useProjectsContext } from './projects-provider'
import { useCreateProjectMutation, useUpdateProjectMutation } from '../hooks/use-projects-query'
import { createProjectRequestSchema, type CreateProjectRequest, PROJECT_STATUS_LABELS, PROJECT_STATUS_OPTIONS } from '@/features/projects/data/api-schema'

export function ProjectsEditSheet() {
  const {
    isProjectSheetOpen,
    setIsProjectSheetOpen,
    isProjectDetailSheetOpen,
    setIsProjectDetailSheetOpen,
    editingProject,
    viewingProject,
    isCreateMode,
    closeAllSheets,
  } = useProjectsContext()

  const createProjectMutation = useCreateProjectMutation()
  const updateProjectMutation = useUpdateProjectMutation()

  const form = useForm<CreateProjectRequest>({
    resolver: zodResolver(createProjectRequestSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: 'active',
    },
  })

  // 当编辑项目时，填充表单数据
  useEffect(() => {
    if (editingProject && !isCreateMode) {
      form.reset({
        name: editingProject.name,
        code: editingProject.code,
        description: editingProject.description,
        status: editingProject.status,
      })
    } else if (isCreateMode) {
      form.reset({
        name: '',
        code: '',
        description: '',
        status: 'active',
      })
    }
  }, [editingProject, isCreateMode, form])

  const onSubmit = async (data: CreateProjectRequest) => {
    try {
      if (isCreateMode) {
        await createProjectMutation.mutateAsync(data)
      } else if (editingProject) {
        await updateProjectMutation.mutateAsync({
          id: editingProject.id,
          data,
        })
      }
      closeAllSheets()
      form.reset()
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  }

  const handleCancel = () => {
    closeAllSheets()
    form.reset()
  }

  const isLoading = createProjectMutation.isPending || updateProjectMutation.isPending

  return (
    <>
      {/* 编辑/新增项目抽屉 */}
      <Sheet open={isProjectSheetOpen} onOpenChange={setIsProjectSheetOpen}>
        <SheetContent side='right'>
          <SheetHeader>
            <SheetTitle>{isCreateMode ? '新增项目' : '编辑项目'}</SheetTitle>
            <SheetDescription>
              {isCreateMode ? '填写项目信息以创建新的项目' : '修改项目信息'}
            </SheetDescription>
          </SheetHeader>

          <div className='px-6 py-4'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
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

                <div className='flex justify-end space-x-3 pt-6 mt-8 border-t'>
                  <Button type='button' variant='outline' onClick={handleCancel}>
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

      {/* 项目详情抽屉 */}
      <Sheet open={isProjectDetailSheetOpen} onOpenChange={setIsProjectDetailSheetOpen}>
        <SheetContent side='right' className='!w-[450px] !max-w-[450px]'>
          <SheetHeader>
            <SheetTitle className='flex items-center gap-2'>
              <Eye className='h-5 w-5' />
              项目详情
            </SheetTitle>
            <SheetDescription>
              查看项目的详细信息
            </SheetDescription>
          </SheetHeader>

          {viewingProject && (
            <div className='px-6 py-4 space-y-6'>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>项目ID</label>
                <p className='mt-1 text-sm font-mono bg-muted px-2 py-1 rounded'>
                  {viewingProject.id}
                </p>
              </div>

              <div>
                <label className='text-sm font-medium text-muted-foreground'>项目名称</label>
                <p className='mt-1 text-base font-medium'>{viewingProject.name}</p>
              </div>

              <div>
                <label className='text-sm font-medium text-muted-foreground'>项目代码</label>
                <p className='mt-1 text-sm font-mono bg-muted px-2 py-1 rounded'>
                  {viewingProject.code}
                </p>
              </div>

              <div>
                <label className='text-sm font-medium text-muted-foreground'>项目描述</label>
                <p className='mt-1 text-sm text-muted-foreground whitespace-pre-wrap'>
                  {viewingProject.description || '暂无描述'}
                </p>
              </div>

              <div>
                <label className='text-sm font-medium text-muted-foreground'>项目状态</label>
                <div className='mt-1'>
                  <Badge variant={viewingProject.status === 'active' ? 'default' : 'secondary'}>
                    {PROJECT_STATUS_LABELS[viewingProject.status]}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className='grid grid-cols-1 gap-4'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Calendar className='h-4 w-4' />
                  <span>创建时间：{new Date(viewingProject.created_at).toLocaleString('zh-CN')}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Clock className='h-4 w-4' />
                  <span>更新时间：{new Date(viewingProject.updated_at).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}