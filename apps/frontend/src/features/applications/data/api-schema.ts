import { z } from 'zod'

// 应用状态枚举
export const applicationStatusSchema = z.enum(['active', 'disabled'])
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>

// 分页信息
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  total_pages: z.number().optional(),
})

export type Pagination = z.infer<typeof paginationSchema>

// 应用响应数据
export const applicationResponseSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  name: z.string(),
  code: z.string(),
  status: applicationStatusSchema,
  description: z.string(),
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
  status: applicationStatusSchema
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

// ===================================================================
// 任务管理相关类型定义
// ===================================================================

// 任务状态枚举
export const taskStatusSchema = z.enum([
  'pending',
  'dispatched', 
  'running',
  'success',
  'failed',
  'timeout',
  'cancelled'
])
export type TaskStatus = z.infer<typeof taskStatusSchema>

// 任务创建请求
export const taskCreateRequestSchema = z.object({
  task_name: z.string().min(1, '任务名称不能为空'),
  task_type: z.string().min(1, '任务类型不能为空'),
  target_instances: z.array(z.string()).min(1, '至少选择一个实例'),
  task_content: z.any(),
  priority: z.number().min(1).max(10).optional(),
  timeout_seconds: z.number().positive().optional(),
  retry_count: z.number().nonnegative().optional(),
})

export type TaskCreateRequest = z.infer<typeof taskCreateRequestSchema>

// 任务响应
export const taskResponseSchema = z.object({
  id: z.string(),
  task_name: z.string(),
  task_type: z.string(),
  target_instances: z.any(),
  task_content: z.any(),
  priority: z.number(),
  timeout_seconds: z.number(),
  retry_count: z.number(),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type TaskResponse = z.infer<typeof taskResponseSchema>

// 任务列表响应
export const taskListResponseSchema = z.object({
  data: z.array(taskResponseSchema),
  pagination: paginationSchema,
  timestamp: z.number(),
  trace_id: z.string(),
})

export type TaskListResponse = z.infer<typeof taskListResponseSchema>

// 任务执行记录响应
export const taskRecordResponseSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  instance_id: z.string(),
  status: z.string(),
  dispatch_time: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  duration_ms: z.number().optional(),
  result_code: z.number().optional(),
  result_message: z.string().optional(),
  result_data: z.any().optional(),
  error_message: z.string().optional(),
  retry_attempt: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type TaskRecordResponse = z.infer<typeof taskRecordResponseSchema>

// 任务执行记录列表响应
export const taskRecordListResponseSchema = z.object({
  data: z.array(taskRecordResponseSchema),
  pagination: paginationSchema,
  timestamp: z.number(),
  trace_id: z.string(),
})

export type TaskRecordListResponse = z.infer<typeof taskRecordListResponseSchema>

// 获取任务列表参数
export const getTasksParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  status: z.string().optional(),
  task_type: z.string().optional(),
})

export type GetTasksParams = z.infer<typeof getTasksParamsSchema>

// 获取任务执行记录参数
export const getTaskRecordsParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  status: z.string().optional(),
})

export type GetTaskRecordsParams = z.infer<typeof getTaskRecordsParamsSchema>

// 任务状态标签映射
export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: '待执行',
  dispatched: '已下发',
  running: '执行中',
  success: '成功',
  failed: '失败',
  timeout: '超时',
  cancelled: '已取消',
}

// ===================================================================
// 类型别名（为向后兼容性）
// ===================================================================

// 从 instances 特性重新导出类型
export type { InstanceResponse as Instance } from '@/features/instances/data/api-schema'

// 任务相关类型别名
export type TaskRecord = TaskRecordResponse
export type TaskResult = TaskRecordResponse