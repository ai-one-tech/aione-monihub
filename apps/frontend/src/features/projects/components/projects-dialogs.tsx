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
import { useDeleteProjectMutation, useProjectQuery } from '../hooks/use-projects-query'

export function ProjectsDialogs() {
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deletingProjectId,
    setDeletingProjectId,
  } = useProjectsContext()

  const { data: deletingProject } = useProjectQuery(deletingProjectId || '')
  const deleteProjectMutation = useDeleteProjectMutation()

  const handleDeleteConfirm = async () => {
    if (!deletingProjectId) return

    try {
      await deleteProjectMutation.mutateAsync(deletingProjectId)
      setIsDeleteDialogOpen(false)
      setDeletingProjectId(null)
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  }

  const handleCancel = () => {
    setIsDeleteDialogOpen(false)
    setDeletingProjectId(null)
  }

  return (
    <>
      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleCancel}>
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
            <AlertDialogCancel onClick={handleCancel}>
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