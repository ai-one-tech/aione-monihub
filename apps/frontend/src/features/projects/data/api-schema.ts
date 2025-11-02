import { z } from 'zod'

// 项目状态枚举
export const projectStatusSchema = z.enum(['active', 'disabled'])
export type ProjectStatus = z.infer<typeof projectStatusSchema>

// 分页信息
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  total_pages: z.number().optional(),
})

export type Pagination = z.infer<typeof paginationSchema>

// 项目响应数据
export const projectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string(),
  status: projectStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
})

export type ProjectResponse = z.infer<typeof projectResponseSchema>

// 项目列表响应
export const projectListResponseSchema = z.object({
  data: z.array(projectResponseSchema),
  pagination: paginationSchema,
  timestamp: z.number(),
  trace_id: z.string(),
})

export type ProjectListResponse = z.infer<typeof projectListResponseSchema>

// 项目详情响应
export const projectDetailResponseSchema = projectResponseSchema
export type ProjectDetailResponse = z.infer<typeof projectDetailResponseSchema>

// 创建项目请求
export const createProjectRequestSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  code: z.string().min(1, '项目代码不能为空'),
  description: z.string().min(1, '项目描述不能为空'),
  status: projectStatusSchema,
})

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>

// 更新项目请求
export const updateProjectRequestSchema = createProjectRequestSchema
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>

// 获取项目列表参数
export const getProjectsParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  status: projectStatusSchema.optional(),
})

export type GetProjectsParams = z.infer<typeof getProjectsParamsSchema>

// 项目状态选项
export const PROJECT_STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '激活' },
  { value: 'disabled', label: '禁用' },
] as const

// 项目状态标签映射
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: '激活',
  disabled: '禁用',
}