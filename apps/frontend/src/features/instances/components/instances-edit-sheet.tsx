'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useInstancesProvider } from './instances-provider'
import { useInstanceQuery } from '../hooks/use-instances-query'
import { CreateInstanceRequest, createInstanceRequestSchema, INSTANCE_STATUS_OPTIONS, INSTANCE_ENVIRONMENT_OPTIONS, OS_TYPE_OPTIONS } from '../data/api-schema'
import { toast } from 'sonner'

export function InstancesEditSheet() {
  const {
    isSheetOpen,
    setIsSheetOpen,
    sheetMode,
    selectedInstanceId,
  } = useInstancesProvider()

  const { data: instanceDetail, isLoading: isLoadingInstance } = useInstanceQuery(selectedInstanceId || '')

  // 移除创建和编辑模式，只保留查看模式
  const isViewMode = sheetMode === 'view' || sheetMode === 'create' || sheetMode === 'edit'

  const form = useForm<CreateInstanceRequest>({
    resolver: zodResolver(createInstanceRequestSchema),
    defaultValues: {
      name: '',
      instance_type: '',
      status: 'active',
      application_id: '',
      mac_address: '',
      public_ip: '',
      port: undefined,
      program_path: '',
      os_type: '',
      os_version: '',
      custom_fields: {},
    },
    mode: 'onChange',
    reValidateMode: 'onBlur',
  })

  useEffect(() => {
    if (instanceDetail) {
      form.reset({
        name: instanceDetail.name,
        instance_type: instanceDetail.instance_type,
        status: instanceDetail.status as any,
        application_id: instanceDetail.application_id,
        mac_address: instanceDetail.mac_address,
        public_ip: instanceDetail.public_ip,
        port: instanceDetail.port,
        program_path: instanceDetail.program_path,
        os_type: instanceDetail.os_type,
        os_version: instanceDetail.os_version,
        custom_fields: instanceDetail.custom_fields,
      })
    }
  }, [instanceDetail, form])

  const handleClose = () => {
    setIsSheetOpen(false)
    form.reset()
  }

  const getSheetTitle = () => {
    return '查看实例'
  }

  const getSheetDescription = () => {
    return '查看实例详细信息'
  }

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={handleClose}>
        <SheetContent side='right' className='sm:max-w-xl'>
          <SheetHeader className='px-6 pt-6'>
          <SheetTitle>{getSheetTitle()}</SheetTitle>
          <SheetDescription>
            {getSheetDescription()}
          </SheetDescription>
          </SheetHeader>

          {(isLoadingInstance) ? (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-sm text-muted-foreground'>加载实例信息中...</div>
            </div>
          ) : (
            <div className='flex-1 overflow-y-auto px-6 py-4'>
              <Form {...form}>
                <form className='space-y-4'>
                  {/* 基础字段 */}
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>实例名称 *</FormLabel>
                        <FormControl>
                          <Input placeholder='请输入实例名称' {...field} disabled={isViewMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='instance_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>环境类型 *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='请选择环境类型' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INSTANCE_ENVIRONMENT_OPTIONS.map((option) => (
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
                    name='application_id'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>应用ID *</FormLabel>
                        <FormControl>
                          <Input placeholder='请输入应用ID' {...field} disabled={isViewMode} />
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
                        <FormLabel>实例状态 *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='请选择实例状态' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INSTANCE_STATUS_OPTIONS.filter(option => option.value !== 'all').map((option) => (
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

                  {/* 网络信息字段 */}
                  <div className='mt-6 pt-4 border-t'>
                    <h3 className='text-sm font-semibold mb-4'>网络信息</h3>
                    
                    <FormField
                      control={form.control}
                      name='public_ip'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>公网IP</FormLabel>
                          <FormControl>
                            <Input placeholder='请输入公网IP地址' {...field} disabled={isViewMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='mac_address'
                      render={({ field }) => (
                        <FormItem className='mt-4'>
                          <FormLabel>MAC地址</FormLabel>
                          <FormControl>
                            <Input placeholder='请输入MAC地址' {...field} disabled={isViewMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='port'
                      render={({ field }) => (
                        <FormItem className='mt-4'>
                          <FormLabel>通信端口</FormLabel>
                          <FormControl>
                            <Input type='number' placeholder='请输入端口号' {...field} disabled={isViewMode} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 系统信息字段 */}
                  <div className='mt-6 pt-4 border-t'>
                    <h3 className='text-sm font-semibold mb-4'>系统信息</h3>
                    
                    <FormField
                      control={form.control}
                      name='os_type'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>操作系统</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} disabled={isViewMode}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='请选择操作系统' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {OS_TYPE_OPTIONS.map((option) => (
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
                      name='os_version'
                      render={({ field }) => (
                        <FormItem className='mt-4'>
                          <FormLabel>操作系统版本</FormLabel>
                          <FormControl>
                            <Input placeholder='请输入操作系统版本' {...field} disabled={isViewMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='program_path'
                      render={({ field }) => (
                        <FormItem className='mt-4'>
                          <FormLabel>程序运行路径</FormLabel>
                          <FormControl>
                            <Input placeholder='请输入程序运行路径' {...field} disabled={isViewMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </div>
          )}

          <SheetFooter>
            <div className='flex justify-end space-x-3 w-full'>
              <Button type='button' variant='outline' onClick={handleClose}>
                关闭
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}