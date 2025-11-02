import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSystemPermissions } from './system-permissions-provider'
import { useDeletePermissionMutation } from '../hooks/use-permission-mutations'

export function SystemPermissionsDeleteDialog() {
  const { isDeleteDialogOpen, setIsDeleteDialogOpen, selectedPermissionId } = useSystemPermissions()
  const deletePermissionMutation = useDeletePermissionMutation()

  const handleDelete = async () => {
    if (!selectedPermissionId) return

    deletePermissionMutation.mutate(selectedPermissionId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
      },
    })
  }

  return (
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>删除权限</DialogTitle>
          <DialogDescription>
            您确定要删除权限 ID: "{selectedPermissionId}" 吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => setIsDeleteDialogOpen(false)}
          >
            取消
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleDelete}
            disabled={deletePermissionMutation.isPending}
          >
            {deletePermissionMutation.isPending ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
