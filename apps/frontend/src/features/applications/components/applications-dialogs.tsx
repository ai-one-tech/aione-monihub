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
import { useDeleteApplication } from '../hooks/use-applications-query'

export function ApplicationsDialogs() {
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deletingApplication,
    setDeletingApplication,
  } = useApplicationsProvider()

  const deleteApplicationMutation = useDeleteApplication()

  const handleDeleteConfirm = async () => {
    if (!deletingApplication) return

    try {
      await deleteApplicationMutation.mutateAsync(deletingApplication.id)
      setIsDeleteDialogOpen(false)
      setDeletingApplication(null)
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  }

  const handleCancel = () => {
    setIsDeleteDialogOpen(false)
    setDeletingApplication(null)
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