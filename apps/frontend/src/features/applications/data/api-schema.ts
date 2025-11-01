import { z } from 'zod'

// 应用状态枚举
export const applicationStatusSchema = z.enum(['active', 'disabled'])
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>

// 分页信息
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
})

export type Pagination = z.infer<typeof paginationSchema>

// 授权信息
export const authorizationSchema = z.object({
  users: z.array(z.string()),
  expiry_date: z.string().nullable(),
})

export type Authorization = z.infer<typeof authorizationSchema>

// 应用响应数据
export const applicationResponseSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  name: z.string(),
  code: z.string(),
  status: applicationStatusSchema,
  description: z.string(),
  authorization: authorizationSchema,
  created_at: z.string(),
  updated_at: z.string(),
})

export type ApplicationResponse = z.infer<typeof applicationResponseSchema>

// 应用列表响应
export const applicationListResponseSchema = z.object({
  data: z.array(applicationResponseSchema),
  pagination: paginationSchema,
  timestamp: z.number(),
  trace_id: z.string(),
})

export type ApplicationListResponse = z.infer<typeof applicationListResponseSchema>

// 应用详情响应
export const applicationDetailResponseSchema = applicationResponseSchema
export type ApplicationDetailResponse = z.infer<typeof applicationDetailResponseSchema>

// 创建应用请求
export const createApplicationRequestSchema = z.object({
  project_id: z.string().min(1, '项目ID不能为空'),
  name: z.string().min(1, '应用名称不能为空'),
  code: z.string().min(1, '应用代码不能为空'),
  description: z.string().min(1, '应用描述不能为空'),
  status: applicationStatusSchema,
  authorization: z.object({
    users: z.array(z.string()),
    expiry_date: z.string().nullable(),
  }),
})

export type CreateApplicationRequest = z.infer<typeof createApplicationRequestSchema>

// 更新应用请求
export const updateApplicationRequestSchema = createApplicationRequestSchema
export type UpdateApplicationRequest = z.infer<typeof updateApplicationRequestSchema>

// 获取应用列表参数
export const getApplicationsParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  status: applicationStatusSchema.optional(),
  project_id: z.string().optional(),
})

export type GetApplicationsParams = z.infer<typeof getApplicationsParamsSchema>

// 应用状态选项
export const APPLICATION_STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '激活' },
  { value: 'disabled', label: '禁用' },
] as const

// 应用状态标签映射
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  active: '激活',
  disabled: '禁用',
}