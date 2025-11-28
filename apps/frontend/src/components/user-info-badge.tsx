import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell, User, LogOut, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'

export function UserInfoBadge() {
  const [expanded, setExpanded] = useState(false)
  const [signOutOpen, setSignOutOpen] = useDialogState()
  const { auth } = useAuthStore()
  const { user } = auth

  // 如果没有用户信息，不显示组件
  if (!user) {
    return null
  }

  const displayName = user.email ? user.email.split('@')[0] : '用户'
  const displayEmail = user.email || 'user@example.com'
  const avatarFallback = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      <div className='fixed right-4 bottom-4 z-40'>
        {!expanded ? (
          // 收缩状态：显示头像和通知徽章
          <div className='flex items-center space-x-2'>
            {/* 通知按钮 */}
            <Button
              variant='outline'
              size='icon'
              className='h-10 w-10 rounded-full shadow-lg'
              asChild
            >
              <Link to='/settings/notifications'>
                <Bell className='h-4 w-4' />
                <Badge
                  variant='destructive'
                  className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs'
                >
                  3
                </Badge>
              </Link>
            </Button>

            {/* 用户头像按钮 */}
            <Button
              variant='outline'
              className='h-10 w-10 rounded-full p-0 shadow-lg'
              onClick={() => setExpanded(true)}
            >
              <Avatar className='h-8 w-8'>
                <AvatarImage src='/avatars/01.png' alt={displayName} />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
            </Button>
          </div>
        ) : (
          // 展开状态：显示用户信息卡片
          <Card className='w-64 shadow-lg'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>用户信息</CardTitle>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() => setExpanded(false)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* 用户基本信息 */}
              <div className='flex items-center space-x-3'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage src='/avatars/01.png' alt={displayName} />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium text-gray-900'>
                    {displayName}
                  </p>
                  <p className='truncate text-sm text-gray-500'>
                    {displayEmail}
                  </p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className='space-y-2'>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  asChild
                >
                  <Link to='/settings'>
                    <User className='mr-2 h-4 w-4' />
                    查看用户信息
                  </Link>
                </Button>

                <Button
                  variant='outline'
                  className='w-full justify-start'
                  asChild
                >
                  <Link to='/settings/notifications'>
                    <Bell className='mr-2 h-4 w-4' />
                    系统通知
                    <Badge
                      variant='destructive'
                      className='ml-auto flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs'
                    >
                      3
                    </Badge>
                  </Link>
                </Button>

                <Button
                  variant='outline'
                  className='w-full justify-start text-red-600 hover:text-red-700'
                  onClick={() => setSignOutOpen(true)}
                >
                  <LogOut className='mr-2 h-4 w-4' />
                  退出登录
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <SignOutDialog open={!!signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  )
}
