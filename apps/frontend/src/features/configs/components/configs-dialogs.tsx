import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useConfigsProvider } from './configs-provider'
import { useDeleteConfig } from '../hooks/use-configs-query'
import { toast } from 'sonner'

export function ConfigsDialogs() {
  const { isDeleteDialogOpen, setIsDeleteDialogOpen, selectedConfigId } = useConfigsProvider()
  const deleteMutation = useDeleteConfig()
  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除该配置？</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={async () => { if (selectedConfigId) { await deleteMutation.mutateAsync(selectedConfigId); toast.success('删除成功'); setIsDeleteDialogOpen(false) } }}>删除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}