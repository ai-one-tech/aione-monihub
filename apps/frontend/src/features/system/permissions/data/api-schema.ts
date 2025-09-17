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
  created_at: z.string(),
  updated_at: z.string(),
})

export type ApiPermissionResponse = z.infer<typeof apiPermissionResponseSchema>

// 权限列表响应
export const permissionListResponseSchema = z.object({
  data: z.array(apiPermissionResponseSchema),
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