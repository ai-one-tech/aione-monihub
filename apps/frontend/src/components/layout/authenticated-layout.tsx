import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { UserInfoBadge } from '@/components/user-info-badge'
import { LoginDialog } from '@/components/auth/login-dialog'
import { NetworkErrorDialog } from '@/components/network-error-dialog'
import { useAuthCheck } from '@/hooks/use-auth-check'
import { Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const {
    isAuthenticated,
    isLoading,
    showLoginDialog,
    showNetworkError,
    setShowLoginDialog,
    setShowNetworkError,
    handleLoginSuccess,
    retryNetwork
  } = useAuthCheck()

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在验证身份...
        </div>
      </div>
    )
  }

  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarInset>
            <div
              className={cn(
                'flex min-h-screen w-full flex-col',
                'bg-background'
              )}
            >
              <Header fixed>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                  <ThemeSwitch />
                  <ConfigDrawer />
                  <ProfileDropdown />
                </div>
              </Header>
              {children}
              <Outlet />
            </div>
            <UserInfoBadge />
          </SidebarInset>
          
          {/* 登录弹窗 */}
          <LoginDialog 
            open={showLoginDialog} 
            onOpenChange={setShowLoginDialog} 
            onLoginSuccess={handleLoginSuccess} 
          />
          
          {/* 网络错误弹窗 */}
          <NetworkErrorDialog
            open={showNetworkError}
            onOpenChange={setShowNetworkError}
            onRetry={retryNetwork}
          />
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}