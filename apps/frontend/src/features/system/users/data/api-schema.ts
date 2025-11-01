import { z } from 'zod'

// 角色信息结构
export const roleInfoSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
})

export type RoleInfo = z.infer<typeof roleInfoSchema>

// API 返回的用户数据结构
export const apiUserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  status: z.string(),
  roles: z.array(roleInfoSchema),
})

export type ApiUserResponse = z.infer<typeof apiUserResponseSchema>

// 用户详情响应结构（与get_user API规范一致）
export const userDetailResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  status: z.string(),
  roles: z.array(z.string()),
})

export type UserDetailResponse = z.infer<typeof userDetailResponseSchema>

// 创建用户请求结构
export const createUserRequestSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
  status: z.string(),
  roles: z.array(z.string()).min(1, '请至少选择一个角色'),
})

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>

// 更新用户请求结构
export const updateUserRequestSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  status: z.string().optional(),
  roles: z.array(z.string()).optional(),
})

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>

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