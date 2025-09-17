import { z } from 'zod'

// API 返回的用户数据结构
export const apiUserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  roles: z.array(z.string()),
})

export type ApiUserResponse = z.infer<typeof apiUserResponseSchema>

// 分页信息
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
})

export type Pagination = z.infer<typeof paginationSchema>

// 用户列表响应
export const userListResponseSchema = z.object({
  data: z.array(apiUserResponseSchema),
  pagination: paginationSchema,
  timestamp: z.number(),
  trace_id: z.string(),
})

export type UserListResponse = z.infer<typeof userListResponseSchema>

// 查询参数
export const getUsersParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
})

export type GetUsersParams = z.infer<typeof getUsersParamsSchema>