import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  createConfigRequestSchema,
  type CreateConfigRequest,
  CONFIG_TYPE_OPTIONS,
} from '../data/api-schema'
import {
  useCreateConfig,
  useUpdateConfig,
  useConfigsQuery,
} from '../hooks/use-configs-query'
import { useConfigsProvider } from './configs-provider'

export function ConfigsEditSheet() {
  const { isSheetOpen, setIsSheetOpen, sheetMode, selectedConfigId } =
    useConfigsProvider()
  const createMutation = useCreateConfig()
  const updateMutation = useUpdateConfig()
  const { data } = useConfigsQuery()

  const isCreateMode = sheetMode === 'create'
  const isEditMode = sheetMode === 'edit'
  const isViewMode = sheetMode === 'view'

  const form = useForm<CreateConfigRequest>({
    resolver: zodResolver(createConfigRequestSchema),
    defaultValues: {
      code: '',
      environment: 'dev',
      name: '',
      config_type: 'text',
      content: '',
      description: '',
      generate_values: false,
      schema: '',
    },
    mode: 'onChange',
    reValidateMode: 'onBlur',
  })

  useEffect(() => {
    if ((isEditMode || isViewMode) && selectedConfigId) {
      const cur = data?.data.find((c) => c.id === selectedConfigId)
      if (cur) {
        const target: CreateConfigRequest = {
          code: cur.code,
          environment: cur.environment,
          name: cur.name,
          config_type: cur.config_type,
          content: cur.content,
          description: cur.description,
          generate_values: cur.generate_values,
          schema: cur.schema ?? '',
        }
        const needReset =
          JSON.stringify(form.getValues()) !== JSON.stringify(target)
        if (needReset) form.reset(target)
      }
    } else if (isCreateMode) {
      const defaults: CreateConfigRequest = {
        code: '',
        environment: 'dev',
        name: '',
        config_type: 'text',
        content: '',
        description: '',
        generate_values: false,
        schema: '',
      }
      const needReset =
        JSON.stringify(form.getValues()) !== JSON.stringify(defaults)
      if (needReset) form.reset(defaults)
    }
  }, [isEditMode, isViewMode, isCreateMode, selectedConfigId, data])

  const onSubmit = async (payload: CreateConfigRequest) => {
    try {
      if (payload.config_type === 'array' && payload.generate_values) {
        try {
          const v = JSON.parse(payload.content)
          if (!Array.isArray(v)) throw new Error('内容需为数组')
          v.forEach((item: any) => {
            if (
              !item ||
              typeof item !== 'object' ||
              typeof item.code !== 'string' ||
              typeof item.name !== 'string'
            )
              throw new Error('数组项需包含字符串字段 code 与 name')
          })
        } catch (_) {
          toast.error('数组内容或项结构不合法')
          return
        }
      }
      if (payload.config_type === 'object') {
        try {
          const v = JSON.parse(payload.content)
          if (typeof v !== 'object' || Array.isArray(v) || v === null)
            throw new Error('')
        } catch (_) {
          toast.error('对象内容需为合法 JSON 对象')
          return
        }
      }
      if (payload.config_type === 'array' && !payload.generate_values) {
        try {
          const v = JSON.parse(payload.content)
          if (!Array.isArray(v)) throw new Error('')
        } catch (_) {
          toast.error('数组内容需为合法 JSON 数组')
          return
        }
      }
      if (payload.schema) {
        try {
          JSON.parse(payload.schema)
        } catch (_) {
          toast.error('Schema 必须为合法 JSON')
          return
        }
      }
      if (isCreateMode) {
        await createMutation.mutateAsync(payload)
        toast.success('配置创建成功')
      } else if (isEditMode && selectedConfigId) {
        await updateMutation.mutateAsync({
          configId: selectedConfigId,
          data: payload,
        })
        toast.success('配置更新成功')
      }
      handleClose()
    } catch (e) {
      console.error(e)
    }
  }

  const handleClose = () => {
    setIsSheetOpen(false)
    form.reset()
  }

  const getTitle = () =>
    isCreateMode ? '新增配置' : isEditMode ? '编辑配置' : '查看配置'
  const getDesc = () =>
    isCreateMode
      ? '填写配置信息以创建新配置'
      : isEditMode
        ? '修改配置信息'
        : '查看配置详细信息'

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleClose}>
      <SheetContent side='right'>
        <SheetHeader className='px-6 pt-6'>
          <SheetTitle>{getTitle()}</SheetTitle>
          <SheetDescription>{getDesc()}</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          <Form {...form}>
            <form
              id='config-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-8'
            >
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>配置代码 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入配置代码'
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
                name='environment'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>环境 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isViewMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='请选择环境' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='dev'>dev</SelectItem>
                        <SelectItem value='test'>test</SelectItem>
                        <SelectItem value='staging'>staging</SelectItem>
                        <SelectItem value='prod'>prod</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>配置名称 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入配置名称'
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
                name='config_type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>配置类型 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isViewMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='请选择类型' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONFIG_TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
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
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='请输入描述'
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
                name='content'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>内容 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='根据类型填写内容；object/array 需为合法 JSON'
                        className='min-h-40'
                        {...field}
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {['object', 'array'].includes(form.watch('config_type')) && (
                <FormField
                  control={form.control}
                  name='schema'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schema（JSON，可选）</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='对象/数组的结构声明，填写 JSON'
                          className='min-h-32'
                          {...field}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.watch('config_type') === 'array' && (
                <FormField
                  control={form.control}
                  name='generate_values'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center gap-2'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormLabel>生成选项值</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>
        {!isViewMode && (
          <SheetFooter className='px-6 py-4'>
            <Button
              type='submit'
              form='config-form'
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isCreateMode ? '创建' : '保存'}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
