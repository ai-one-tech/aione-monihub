import { z } from 'zod'

// API 返回的角色数据结构
export const apiRoleResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ApiRoleResponse = z.infer<typeof apiRoleResponseSchema>

// 角色列表响应
export const roleListResponseSchema = z.object({
  data: z.array(apiRoleResponseSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
  timestamp: z.number(),
  trace_id: z.string(),
})

export type RoleListResponse = z.infer<typeof roleListResponseSchema>

// 查询参数
export const getRolesParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
})

export type GetRolesParams = z.infer<typeof getRolesParamsSchema>

// 创建角色请求
export const createRoleRequestSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  description: z.string().min(1, '角色描述不能为空'),
  permissions: z.array(z.string()).default([]),
})

export type CreateRoleRequest = z.infer<typeof createRoleRequestSchema>

// 更新角色请求
export const updateRoleRequestSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  description: z.string().min(1, '角色描述不能为空'),
  permissions: z.array(z.string()).default([]),
})

export type UpdateRoleRequest = z.infer<typeof updateRoleRequestSchema>

// 角色表单数据
export const roleFormSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  description: z.string().min(1, '角色描述不能为空'),
  permissions: z.array(z.string()),
})

export type RoleFormData = z.infer<typeof roleFormSchema>
