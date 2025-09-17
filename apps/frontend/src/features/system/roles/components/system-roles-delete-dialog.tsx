import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useSystemRolesContext } from './system-roles-provider'
import { useDeleteRoleMutation } from '../hooks/use-roles-query'

export function SystemRolesDeleteDialog() {
  const { deleteRoleId, setDeleteRoleId } = useSystemRolesContext()
  const deleteRoleMutation = useDeleteRoleMutation()

  const handleDelete = async () => {
    if (!deleteRoleId) return
    
    try {
      await deleteRoleMutation.mutateAsync(deleteRoleId)
      setDeleteRoleId(null)
    } catch (error) {
      // 错误处理已在 mutation 中完成
    }
  }

  const handleClose = () => {
    setDeleteRoleId(null)
  }

  return (
    <AlertDialog open={!!deleteRoleId} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除角色</AlertDialogTitle>
          <AlertDialogDescription>
            此操作将永久删除该角色。删除后，所有关联的用户将失去此角色的权限。
            <br />
            <strong>此操作无法撤销。</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRoleMutation.isPending}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRoleMutation.isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {deleteRoleMutation.isPending ? '删除中...' : '确认删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}