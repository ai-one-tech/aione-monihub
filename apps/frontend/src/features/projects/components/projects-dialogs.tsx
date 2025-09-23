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
import { useProjectsContext } from './projects-provider'
import { useDeleteProjectMutation } from '../hooks/use-projects-query'

export function ProjectsDialogs() {
  const {
    isDeleteDialogOpen,
    closeDeleteDialog,
    deletingProject,
  } = useProjectsContext()

  const deleteProjectMutation = useDeleteProjectMutation()

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return

    try {
      await deleteProjectMutation.mutateAsync(deletingProject.id)
      closeDeleteDialog()
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  }

  return (
    <>
      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-destructive' />
              确认删除项目
            </AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除项目 &quot;{deletingProject?.name}&quot; 吗？
              <br />
              <span className='text-destructive font-medium'>
                此操作无法撤销，项目的所有数据将被永久删除。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}