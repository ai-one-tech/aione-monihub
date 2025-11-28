import { Power, PowerOff } from 'lucide-react'
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
  useEnableInstance,
  useDisableInstance,
  useInstanceQuery,
} from '../hooks/use-instances-query'
import { useInstancesProvider } from './instances-provider'

export function InstancesEnableDisableDialog() {
  const {
    isEnableDisableDialogOpen,
    setIsEnableDisableDialogOpen,
    enableDisableInstanceId,
    setEnableDisableInstanceId,
    enableDisableAction,
    setEnableDisableAction,
  } = useInstancesProvider()

  const { data: enableDisableInstance } = useInstanceQuery(
    enableDisableInstanceId || ''
  )
  const enableInstanceMutation = useEnableInstance()
  const disableInstanceMutation = useDisableInstance()

  const isEnable = enableDisableAction === 'enable'
  const isPending = isEnable
    ? enableInstanceMutation.isPending
    : disableInstanceMutation.isPending

  const handleConfirm = async () => {
    if (!enableDisableInstanceId || !enableDisableAction) return

    try {
      if (isEnable) {
        await enableInstanceMutation.mutateAsync(enableDisableInstanceId)
      } else {
        await disableInstanceMutation.mutateAsync(enableDisableInstanceId)
      }
      setIsEnableDisableDialogOpen(false)
      setEnableDisableInstanceId(null)
      setEnableDisableAction(null)
    } catch (error) {
      // 错误处理已在mutation中完成
    }
  }

  const handleCancel = () => {
    setIsEnableDisableDialogOpen(false)
    setEnableDisableInstanceId(null)
    setEnableDisableAction(null)
  }

  return (
    <AlertDialog
      open={isEnableDisableDialogOpen}
      onOpenChange={setIsEnableDisableDialogOpen}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            {isEnable ? (
              <>
                <Power className='h-5 w-5 text-green-600' />
                确认启用实例
              </>
            ) : (
              <>
                <PowerOff className='h-5 w-5 text-orange-600' />
                确认禁用实例
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            您确定要{isEnable ? '启用' : '禁用'}实例 &quot;
            {enableDisableInstance?.name}&quot; 吗？
            <br />
            {isEnable ? (
              <span className='font-medium text-green-600'>
                启用后，实例将开始正常监控和上报数据。
              </span>
            ) : (
              <span className='font-medium text-orange-600'>
                禁用后，实例将停止监控和上报数据，但配置信息会保留。
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              isEnable
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }
            disabled={isPending}
          >
            {isPending
              ? isEnable
                ? '启用中...'
                : '禁用中...'
              : isEnable
                ? '确认启用'
                : '确认禁用'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
