/**
 * 权限枚举值映射表
 * 用于在UI中显示权限相关的枚举值的中文标签和样式
 */

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

/**
 * 权限操作类型映射
 */
export const ACTION_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  Manage: { label: '管理', variant: 'default' },
  Read: { label: '读取', variant: 'secondary' },
  Create: { label: '创建', variant: 'secondary' },
  Update: { label: '更新', variant: 'secondary' },
  Delete: { label: '删除', variant: 'destructive' },
  Import: { label: '导入', variant: 'secondary' },
  Export: { label: '导出', variant: 'secondary' },
}

/**
 * 权限类型映射
 */
export const PERMISSION_TYPE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  Menu: { label: '菜单', variant: 'default' },
  Page: { label: '页面', variant: 'secondary' },
  Action: { label: '操作', variant: 'secondary' },
}

/**
 * 获取操作的标签和样式
 */
export function getActionInfo(action: string) {
  return ACTION_MAP[action] || { label: action, variant: 'outline' as const }
}

/**
 * 获取权限类型的标签和样式
 */
export function getPermissionTypeInfo(type: string) {
  return PERMISSION_TYPE_MAP[type] || { label: type, variant: 'outline' as const }
}
