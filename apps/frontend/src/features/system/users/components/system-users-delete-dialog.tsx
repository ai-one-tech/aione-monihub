import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSystemUsersContext } from './system-users-provider'

export function SystemUsersDeleteDialog() {
  const { isDeleteDialogOpen, setIsDeleteDialogOpen, selectedUserId } = useSystemUsersContext()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      // TODO: 实现删除用户的API调用
      console.log('删除用户:', selectedUserId)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('删除用户失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>删除用户</DialogTitle>
          <DialogDescription>
            您确定要删除用户 ID: "{selectedUserId}" 吗？此操作无法撤销。
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
            disabled={isLoading}
          >
            {isLoading ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}