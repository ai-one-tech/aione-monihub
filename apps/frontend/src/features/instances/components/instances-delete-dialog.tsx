import { AlertTriangle } from 'lucide-react'
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
import {
  useDeleteInstance,
  useInstanceQuery,
} from '../hooks/use-instances-query'
import { useInstancesProvider } from './instances-provider'

export function InstancesDeleteDialog() {
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deletingInstanceId,
    setDeletingInstanceId,
  } = useInstancesProvider()

  const { data: deletingInstance } = useInstanceQuery(deletingInstanceId || '')
  const deleteInstanceMutation = useDeleteInstance()

  const handleDeleteConfirm = async () => {
    if (!deletingInstanceId) return

    try {
      await deleteInstanceMutation.mutateAsync(deletingInstanceId)
      setIsDeleteDialogOpen(false)
      setDeletingInstanceId(null)
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  }

  const handleCancel = () => {
    setIsDeleteDialogOpen(false)
    setDeletingInstanceId(null)
  }

  return (
    <>
      {/* 删除确认对话框 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='text-destructive h-5 w-5' />
              确认删除实例
            </AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除实例 &quot;{deletingInstance?.name}&quot; 吗？
              <br />
              <span className='text-destructive font-medium'>
                此操作无法撤销，实例的所有数据将被永久删除。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteInstanceMutation.isPending}
            >
              {deleteInstanceMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
