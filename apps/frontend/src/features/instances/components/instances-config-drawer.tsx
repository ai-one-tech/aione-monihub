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
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useInstancesProvider } from './instances-provider'
import { useInstanceQuery, useUpdateInstanceConfig } from '../hooks/use-instances-query'
import { instanceConfigSchema, type InstanceConfig } from '../data/api-schema'
import { toast } from 'sonner'

export function InstancesConfigDrawer() {
  const {
    configDrawerOpen,
    setConfigDrawerOpen,
    selectedInstanceId,
  } = useInstancesProvider()

  const { data: instanceDetail, isLoading: isLoadingInstance, refetch } = useInstanceQuery(selectedInstanceId || '')
  const updateConfig = useUpdateInstanceConfig()

  const form = useForm<InstanceConfig>({
    resolver: zodResolver(instanceConfigSchema.partial()),
    mode: 'onChange',
    reValidateMode: 'onBlur',
  })

  useEffect(() => {
    const cfg = (instanceDetail as any)?.config
    if (cfg) {
      form.reset(cfg as InstanceConfig)
    }
  }, [instanceDetail, form])

  useEffect(() => {
    if (configDrawerOpen && selectedInstanceId) {
      refetch()
    }
  }, [configDrawerOpen, selectedInstanceId, refetch])

  const handleClose = () => {
    setConfigDrawerOpen(false)
    form.reset()
  }

  const handleSubmit = async (values: InstanceConfig) => {
    if (!selectedInstanceId) return
    try {
      await updateConfig.mutateAsync({ instanceId: selectedInstanceId, config: values })
      setConfigDrawerOpen(false)
    } catch (e: any) {
      let message = '更新配置失败'
      if (e?.message) message = e.message
      toast.error(message)
    }
  }

  return (
    <Sheet open={configDrawerOpen} onOpenChange={handleClose}>
      <SheetContent side='right' className='sm:max-w-xl'>
        <SheetHeader className='px-6 pt-6'>
          <SheetTitle>实例配置</SheetTitle>
          <SheetDescription>编辑并更新实例的配置项</SheetDescription>
        </SheetHeader>

        {isLoadingInstance ? (
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-sm text-muted-foreground'>加载实例配置中...</div>
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto px-6 py-4'>
            <Form {...form}>
              <form id='instance-config-form' className='space-y-6' onSubmit={form.handleSubmit(handleSubmit)}>
                {/* Debug 分组 */}
                <div>
                  <h3 className='text-sm font-semibold mb-4'>调试</h3>
                  <FormField
                    control={form.control}
                    name='debug'
                    render={({ field }) => (
                      <FormItem className='flex items-center justify-between'>
                        <FormLabel>启用调试模式</FormLabel>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Report 分组 */}
                <div className='pt-4 border-t'>
                  <h3 className='text-sm font-semibold mb-4'>上报配置</h3>
                  <FormField
                    control={form.control}
                    name='report.enabled'
                    render={({ field }) => (
                      <FormItem className='flex items-center justify-between'>
                        <FormLabel>启用上报</FormLabel>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='report.interval_seconds'
                    render={({ field }) => (
                      <FormItem className='mt-4'>
                        <FormLabel>上报间隔（秒）</FormLabel>
                        <FormControl>
                          <Input type='number' value={field.value} onChange={(e) => field.onChange(parseInt(e.target.value || '0'))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='report.max_log_retention'
                    render={({ field }) => (
                      <FormItem className='mt-4'>
                        <FormLabel>最大日志数</FormLabel>
                        <FormControl>
                          <Input type='number' value={field.value} onChange={(e) => field.onChange(parseInt(e.target.value || '0'))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Task 分组 */}
                <div className='pt-4 border-t'>
                  <h3 className='text-sm font-semibold mb-4'>任务配置</h3>
                  <FormField
                    control={form.control}
                    name='task.enabled'
                    render={({ field }) => (
                      <FormItem className='flex items-center justify-between'>
                        <FormLabel>启用任务功能</FormLabel>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='task.long_poll_timeout_seconds'
                    render={({ field }) => (
                      <FormItem className='mt-4'>
                        <FormLabel>长轮询超时（秒）</FormLabel>
                        <FormControl>
                          <Input type='number' value={field.value} onChange={(e) => field.onChange(parseInt(e.target.value || '0'))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* HTTP 分组 */}
                <div className='pt-4 border-t'>
                  <h3 className='text-sm font-semibold mb-4'>HTTP配置</h3>
                  <FormField
                    control={form.control}
                    name='http.proxy_enabled'
                    render={({ field }) => (
                      <FormItem className='flex items-center justify-between'>
                        <FormLabel>启用代理</FormLabel>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 代理详情，仅在启用时显示 */}
                  {form.watch('http.proxy_enabled') && (
                    <div className='mt-4 grid grid-cols-1 gap-4'>
                      <FormField
                        control={form.control}
                        name='http.proxy_host'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>代理地址</FormLabel>
                            <FormControl>
                              <Input placeholder='host 或 http(s) 地址' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='http.proxy_port'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>代理端口</FormLabel>
                            <FormControl>
                              <Input type='number' value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='http.proxy_username'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>代理用户名</FormLabel>
                            <FormControl>
                              <Input placeholder='可选' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='http.proxy_password'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>代理密码</FormLabel>
                            <FormControl>
                              <Input type='password' placeholder='可选' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </div>
        )}
        <SheetFooter>
          <div className='flex justify-end space-x-3 w-full'>
            <Button type='button' variant='outline' onClick={handleClose}>取消</Button>
            <Button type='submit' form='instance-config-form' disabled={updateConfig.isPending}>保存</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
