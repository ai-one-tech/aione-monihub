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
import { useApplicationsProvider } from './applications-provider'
import { useDeleteApplication, useApplicationQuery } from '../hooks/use-applications-query'

export function ApplicationsDialogs() {
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deletingApplicationId,
    setDeletingApplicationId,
  } = useApplicationsProvider()

  const { data: deletingApplication } = useApplicationQuery(deletingApplicationId || '')
  const deleteApplicationMutation = useDeleteApplication()

  const handleDeleteConfirm = async () => {
    if (!deletingApplicationId) return

    try {
      await deleteApplicationMutation.mutateAsync(deletingApplicationId)
      setIsDeleteDialogOpen(false)
      setDeletingApplicationId(null)
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  }

  const handleCancel = () => {
    setIsDeleteDialogOpen(false)
    setDeletingApplicationId(null)
  }

  return (
    <>
      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-destructive' />
              确认删除应用
            </AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除应用 &quot;{deletingApplication?.name}&quot; 吗？
              <br />
              <span className='text-destructive font-medium'>
                此操作无法撤销，应用的所有数据将被永久删除。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteApplicationMutation.isPending}
            >
              {deleteApplicationMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}