import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useSystemRolesContext } from './system-roles-provider'
import { useCreateRoleMutation } from '../hooks/use-roles-query'
import { roleFormSchema, type RoleFormData } from '../data/api-schema'

export function SystemRolesCreateDialog() {
  const { isCreateDialogOpen, setIsCreateDialogOpen } = useSystemRolesContext()
  const createRoleMutation = useCreateRoleMutation()

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  })

  const onSubmit = async (data: RoleFormData) => {
    try {
      await createRoleMutation.mutateAsync(data)
      setIsCreateDialogOpen(false)
      form.reset()
    } catch (error) {
      // 错误处理已在 mutation 中完成
    }
  }

  const handleClose = () => {
    setIsCreateDialogOpen(false)
    form.reset()
  }

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>创建新角色</DialogTitle>
          <DialogDescription>
            创建一个新的系统角色，可以为其分配相应的权限。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色名称</FormLabel>
                  <FormControl>
                    <Input placeholder='请输入角色名称' {...field} />
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
                  <FormLabel>角色描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='请输入角色描述'
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={createRoleMutation.isPending}
              >
                取消
              </Button>
              <Button type='submit' disabled={createRoleMutation.isPending}>
                {createRoleMutation.isPending ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}