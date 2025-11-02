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
import { useUpdateRoleMutation, useCreateRoleMutation, useRoleQuery } from '../hooks/use-roles-query'
import { roleFormSchema, type RoleFormData } from '../data/api-schema'

export function SystemRolesEditDialog() {
  const { isDialogOpen, setIsDialogOpen, dialogMode, selectedRoleId } = useSystemRolesContext()
  const { data: roleDetail, isLoading } = useRoleQuery(selectedRoleId || '')
  const updateRoleMutation = useUpdateRoleMutation()
  const createRoleMutation = useCreateRoleMutation()

  const isEditMode = dialogMode === 'edit'
  const isCreateMode = dialogMode === 'create'

  const form = useForm({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    } as any,
  })

  useEffect(() => {
    if (isEditMode && roleDetail) {
      form.reset({
        name: roleDetail.name,
        description: roleDetail.description,
        permissions: roleDetail.permissions,
      })
    } else if (isCreateMode) {
      form.reset({
        name: '',
        description: '',
        permissions: [],
      })
    }
  }, [roleDetail, form, isEditMode, isCreateMode])

  const onSubmit = async (data: any) => {
    try {
      if (isCreateMode) {
        await createRoleMutation.mutateAsync(data as RoleFormData)
      } else if (isEditMode && selectedRoleId) {
        await updateRoleMutation.mutateAsync({
          roleId: selectedRoleId,
          data: data as RoleFormData,
        })
      }
      handleClose()
      form.reset()
    } catch (error) {
      // 错误处理已在 mutation 中完成
    }
  }

  const handleClose = () => {
    setIsDialogOpen(false)
    form.reset()
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{isCreateMode ? '新增角色' : '编辑角色'}</DialogTitle>
          <DialogDescription>
            {isCreateMode ? '填写角色信息以创建新的角色' : '修改角色信息和权限设置。'}
          </DialogDescription>
        </DialogHeader>
        {(isEditMode && isLoading) ? (
          <div className='flex items-center justify-center py-4'>
            <div className='text-sm text-muted-foreground'>加载角色信息中...</div>
          </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className='space-y-4'>
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
                disabled={isEditMode ? updateRoleMutation.isPending : createRoleMutation.isPending}
              >
                取消
              </Button>
              <Button type='submit' disabled={isEditMode ? updateRoleMutation.isPending : createRoleMutation.isPending}>
                {(isEditMode ? updateRoleMutation.isPending : createRoleMutation.isPending) ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}