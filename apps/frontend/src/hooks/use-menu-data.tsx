import { useQuery } from '@tanstack/react-query'
import { type ElementType } from 'react'
import {
  LayoutDashboard,
  ListTodo,
  Package,
  MessagesSquare,
  Users,
  Settings,
  HelpCircle,
  Wrench,
  Palette,
  Bell,
  Monitor,
  UserCog,
  UsersRound,
  Boxes,
} from 'lucide-react'
import { type NavGroup, type NavItem } from '@/components/layout/types'
import { useAuthStore } from '@/stores/auth-store'
import { apiClient } from '@/lib/api-client'

// 菜单项响应接口
interface MenuItemResponse {
  id: string
  title: string
  path: string
  icon?: string
  is_hidden: boolean
  children?: MenuItemResponse[]
}

// 菜单API响应接口
interface MenuApiResponse {
  data: MenuItemResponse[]
  timestamp?: number
  trace_id?: string
}

// 图标映射表
const iconMap: Record<string, ElementType> = {
  'LayoutDashboard': LayoutDashboard,
  'ListTodo': ListTodo,
  'Package': Package,
  'MessagesSquare': MessagesSquare,
  'Users': Users,
  'Settings': Settings,
  'HelpCircle': HelpCircle,
  'Wrench': Wrench,
  'Palette': Palette,
  'Bell': Bell,
  'Monitor': Monitor,
  'UserCog': UserCog,
  'UsersRound': UsersRound,
  'Boxes': Boxes,
}

/**
 * 将后端菜单数据转换为前端菜单格式
 * 注意：隐藏的菜单项已在后端过滤，这里不需要额外处理
 * 但保留原始数据以便权限判断时使用
 */
function transformMenuToNavItems(menuItems: MenuItemResponse[]): NavItem[] {
  return menuItems.filter(item => !item.is_hidden).map((item): NavItem => {
    const icon = item.icon ? iconMap[item.icon] : undefined
    
    if (item.children && item.children.length > 0) {
      // 有子菜单的情况
      return {
        title: item.title,
        icon: icon,
        items: item.children.filter(child => !child.is_hidden).map((child) => ({
          title: child.title,
          url: child.path,
          icon: child.icon ? iconMap[child.icon] : undefined,
        })),
      }
    } else {
      // 没有子菜单的情况
      return {
        title: item.title,
        url: item.path,
        icon: icon,
      }
    }
  })
}

/**
 * 将菜单数据按分组进行组织
 */
function organizeMenuIntoGroups(menuItems: MenuItemResponse[]): NavGroup[] {
  // 这里可以根据业务需求进行分组
  // 目前简单地将所有菜单放在 "General" 组下
  const navItems = transformMenuToNavItems(menuItems)
  
  return [
    {
      title: 'General',
      items: navItems,
    },
  ]
}

/**
 * 获取用户菜单数据的Hook
 */
export function useMenuData() {
  const { auth } = useAuthStore()
  const { isAuthenticated } = auth
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userMenu'],
    queryFn: async () => {
      // 通过后端接口获取用户菜单
      const response = await apiClient.get<MenuApiResponse>('/api/user/menu')
      return response.data
    },
    enabled: isAuthenticated, // 只有在用户已认证时才请求菜单数据
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 10 * 60 * 1000, // 10分钟垃圾回收
    refetchOnWindowFocus: false,
  })

  // 将API响应转换为前端菜单格式
  const navGroups = data?.data ? organizeMenuIntoGroups(data.data) : []
  
  // 保存原始菜单数据用于权限判断（包含隐藏菜单）
  const rawMenuData = data?.data || []

  return {
    navGroups,
    rawMenuData, // 原始菜单数据，包含所有菜单项（用于权限判断）
    isLoading: isAuthenticated ? isLoading : false, // 未认证时不显示加载状态
    error: isAuthenticated ? error : null, // 未认证时不显示错误
    refetch,
    timestamp: data?.timestamp,
    traceId: data?.trace_id,
  }
}

/**
 * 静态菜单数据（作为降级方案）
 */
export const fallbackNavGroups: NavGroup[] = [
  {
    title: 'General',
    items: [
      {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
      },
      {
        title: '网络测试',
        url: '/system/network-test',
        icon: Wrench,
      },
    ],
  },
]