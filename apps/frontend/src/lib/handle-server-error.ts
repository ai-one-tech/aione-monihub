import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'

// 创建一个全局变量来跟踪网络错误弹窗是否打开
let isNetworkErrorDialogOpen = false

// 设置网络错误弹窗状态的函数
export function setNetworkErrorDialogOpen(isOpen: boolean) {
  isNetworkErrorDialogOpen = isOpen
}

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  // 如果网络错误弹窗已经打开，则不显示toast
  if (isNetworkErrorDialogOpen) {
    return
  }

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Content not found.'
  }

  if (error instanceof AxiosError) {
    errMsg = (error.response?.data as any)?.title || errMsg
  }

  if (error instanceof ApiError) {
    errMsg = error.message || errMsg
  }

  toast.error(errMsg)
}
