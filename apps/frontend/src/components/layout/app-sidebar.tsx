import { useLayout } from '@/context/layout-provider'
import { useAuthStore } from '@/stores/auth-store'
import { useMenuData, fallbackNavGroups } from '@/hooks/use-menu-data'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { auth } = useAuthStore()
  const { user: authUser } = auth
  const { navGroups, isLoading, error, refetch } = useMenuData()

  // 构建用户数据
  const userData = {
    name: authUser?.email ? authUser.email.split('@')[0] : '用户',
    email: authUser?.email || 'user@example.com',
    avatar: '/avatars/01.png',
  }

  // 渲染菜单内容
  const renderMenuContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-4">
          <Skeleton className="h-6 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-6 w-16" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mb-2">
              无法加载菜单数据，请检查网络连接或重试。
            </AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="mt-2"
            >
              重试
            </Button>
          </Alert>
          {/* 使用降级菜单 */}
          <div className="mt-4">
            {fallbackNavGroups.map((props) => (
              <NavGroup key={props.title} {...props} />
            ))}
          </div>
        </div>
      )
    }

    // 正常显示动态菜单
    const menusToRender = navGroups.length > 0 ? navGroups : fallbackNavGroups
    return (
      <>
        {menusToRender.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </>
    )
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {renderMenuContent()}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
