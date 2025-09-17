import { useEffect } from 'react'
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
import { useUpdateRoleMutation } from '../hooks/use-roles-query'
import { roleFormSchema, type RoleFormData } from '../data/api-schema'

export function SystemRolesEditDialog() {
  const { editingRole, setEditingRole } = useSystemRolesContext()
  const updateRoleMutation = useUpdateRoleMutation()

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  })

  useEffect(() => {
    if (editingRole) {
      form.reset({
        name: editingRole.name,
        description: editingRole.description,
        permissions: editingRole.permissions,
      })
    }
  }, [editingRole, form])

  const onSubmit = async (data: RoleFormData) => {
    if (!editingRole) return
    
    try {
      await updateRoleMutation.mutateAsync({
        roleId: editingRole.id,
        data,
      })
      setEditingRole(null)
      form.reset()
    } catch (error) {
      // 错误处理已在 mutation 中完成
    }
  }

  const handleClose = () => {
    setEditingRole(null)
    form.reset()
  }

  return (
    <Dialog open={!!editingRole} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>编辑角色</DialogTitle>
          <DialogDescription>
            修改角色信息和权限设置。
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
                disabled={updateRoleMutation.isPending}
              >
                取消
              </Button>
              <Button type='submit' disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}