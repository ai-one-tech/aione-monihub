import { z } from 'zod'

// API 返回的权限数据结构
export const apiPermissionResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  resource: z.string(),
  action: z.string(),
  permission_type: z.string(),
  menu_path: z.string().nullable(),
  menu_icon: z.string().nullable(),
  parent_permission_id: z.string().nullable(),
  sort_order: z.number().nullable(),
  is_hidden: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ApiPermissionResponse = z.infer<typeof apiPermissionResponseSchema>

// 权限列表响应
export const permissionListResponseSchema = z.object({
  data: z.array(apiPermissionResponseSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
  timestamp: z.number(),
  trace_id: z.string(),
})

export type PermissionListResponse = z.infer<typeof permissionListResponseSchema>

// 查询参数
export const getPermissionsParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  permission_type: z.string().optional(),
  resource: z.string().optional(),
})

export type GetPermissionsParams = z.infer<typeof getPermissionsParamsSchema>

// 创建权限请求
export const createPermissionRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  resource: z.string(),
  action: z.string(),
  permission_type: z.string(),
  menu_path: z.string().optional().nullable(),
  menu_icon: z.string().optional().nullable(),
  parent_permission_id: z.string().optional().nullable(),
  sort_order: z.number().optional().nullable(),
  is_hidden: z.boolean().optional().nullable(),
})

export type CreatePermissionRequest = z.infer<typeof createPermissionRequestSchema>

// 更新权限请求
export const updatePermissionRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  resource: z.string(),
  action: z.string(),
  permission_type: z.string(),
  menu_path: z.string().optional().nullable(),
  menu_icon: z.string().optional().nullable(),
  parent_permission_id: z.string().optional().nullable(),
  sort_order: z.number().optional().nullable(),
  is_hidden: z.boolean().optional().nullable(),
})

export type UpdatePermissionRequest = z.infer<typeof updatePermissionRequestSchema>