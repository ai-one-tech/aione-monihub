import { z } from 'zod'

// 实例状态枚举
export const instanceStatusSchema = z.enum(['active', 'disabled'])
export type InstanceStatus = z.infer<typeof instanceStatusSchema>

// 在线状态枚举
export const onlineStatusSchema = z.enum(['online', 'offline'])
export type OnlineStatus = z.infer<typeof onlineStatusSchema>

// 分页信息
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  total_pages: z.number().optional(),
})

export type Pagination = z.infer<typeof paginationSchema>

// 实例响应数据
export const instanceResponseSchema = z.object({
  id: z.string(),
  hostname: z.string(),
  ip_address: z.string(),
  instance_type: z.string(),
  status: instanceStatusSchema,
  online_status: onlineStatusSchema,
  application_id: z.string(),
  mac_address: z.string().optional(),
  public_ip: z.string().optional(),
  port: z.number().optional(),
  program_path: z.string().optional(),
  os_type: z.string().optional(),
  os_version: z.string().optional(),
  agent_type: z.string().optional(),
  agent_version: z.string().optional(),
  first_report_at: z.string().optional(),
  last_report_at: z.string().optional(),
  report_count: z.number().optional(),
  custom_fields: z.any().optional(),
  config: z.any().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type InstanceResponse = z.infer<typeof instanceResponseSchema>

// 实例列表响应
export const instanceListResponseSchema = z.object({
  data: z.array(instanceResponseSchema),
  pagination: paginationSchema,
  timestamp: z.number(),
  trace_id: z.string(),
})

export type InstanceListResponse = z.infer<typeof instanceListResponseSchema>

// 实例详情响应
export const instanceDetailResponseSchema = instanceResponseSchema
export type InstanceDetailResponse = z.infer<typeof instanceDetailResponseSchema>

// ===================================================================
// 实例配置模型（用于前端表单）
// ===================================================================

export const httpConfigSchema = z.object({
  proxy_enabled: z.boolean().default(false),
  proxy_host: z.string().optional(),
  proxy_port: z.number().optional(),
  proxy_username: z.string().optional(),
  proxy_password: z.string().optional(),
})

export const reportConfigSchema = z.object({
  enabled: z.boolean().default(true),
  interval_seconds: z.number().default(60),
  max_log_retention: z.number().default(1000),
})

export const taskConfigSchema = z.object({
  enabled: z.boolean().default(true),
  long_poll_timeout_seconds: z.number().default(30),
})

export const instanceConfigSchema = z.object({
  debug: z.boolean().default(false),
  report: reportConfigSchema,
  task: taskConfigSchema,
  http: httpConfigSchema,
})

export type InstanceConfig = z.infer<typeof instanceConfigSchema>

// 创建实例请求
export const createInstanceRequestSchema = z.object({
  instance_type: z.string().min(1, '实例类型不能为空'),
  status: instanceStatusSchema,
  application_id: z.string().min(1, '应用ID不能为空'),
  mac_address: z.string().optional(),
  public_ip: z.string().optional(),
  port: z.number().optional(),
  program_path: z.string().optional(),
  os_type: z.string().optional(),
  os_version: z.string().optional(),
  custom_fields: z.any().optional(),
})

export type CreateInstanceRequest = z.infer<typeof createInstanceRequestSchema>

// 更新实例请求
export const updateInstanceRequestSchema = createInstanceRequestSchema
export type UpdateInstanceRequest = z.infer<typeof updateInstanceRequestSchema>

// 获取实例列表参数
export const getInstancesParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  status: instanceStatusSchema.optional(),
  online_status: onlineStatusSchema.optional(),
  application_id: z.string().optional(),
  ip_address: z.string().optional(),
  public_ip: z.string().optional(),
  hostname: z.string().optional(),
  os_type: z.string().optional(),
  mac_address: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
})

export type GetInstancesParams = z.infer<typeof getInstancesParamsSchema>

// 实例状态选项
export const INSTANCE_STATUS_OPTIONS = [
  { value: 'active', label: '正常' },
  { value: 'disabled', label: '已禁用' },
] as const

// 实例状态标签映射
export const INSTANCE_STATUS_LABELS: Record<InstanceStatus, string> = {
  active: '正常',
  disabled: '已禁用',
}

// 实例环境类型选项
export const INSTANCE_ENVIRONMENT_OPTIONS = [
  { value: 'dev', label: '开发环境' },
  { value: 'test', label: '测试环境' },
  { value: 'prod', label: '生产环境' },
] as const

// 操作系统类型选项
export const OS_TYPE_OPTIONS = [
  { value: 'linux', label: 'Linux' },
  { value: 'windows', label: 'Windows' },
  { value: 'macos', label: 'macOS' },
  { value: 'unknown', label: 'Unknown' },
] as const

// ===================================================================
// 实例上报记录相关类型定义
// ===================================================================

// 网络类型枚举选项与模式（保持前后端兼容）
export const NETWORK_TYPE_OPTIONS = ['wired', 'wifi', 'cellular', 'unknown'] as const
export const networkTypeSchema = z.enum(NETWORK_TYPE_OPTIONS)
export type NetworkType = z.infer<typeof networkTypeSchema>

// 实例上报记录响应
export const instanceReportRecordSchema = z.object({
  id: z.string(),
  instance_id: z.string(),
  agent_type: z.string(),
  agent_version: z.string().optional(),
  os_type: z.string().optional(),
  os_version: z.string().optional(),
  hostname: z.string().optional(),
  ip_address: z.string().optional(),
  public_ip: z.string().optional(),
  mac_address: z.string().optional(),
  // 兼容后端返回的单值或数组格式
  network_type: z.union([z.string(), z.array(networkTypeSchema)]).optional(),
  cpu_model: z.string().optional(),
  cpu_cores: z.number().optional(),
  cpu_usage_percent: z.string().optional(),
  memory_total_mb: z.number().optional(),
  memory_used_mb: z.number().optional(),
  memory_usage_percent: z.string().optional(),
  disk_total_gb: z.number().optional(),
  disk_used_gb: z.number().optional(),
  disk_usage_percent: z.string().optional(),
  process_id: z.number().optional(),
  process_uptime_seconds: z.number().optional(),
  thread_count: z.number().optional(),
  custom_metrics: z.any().optional(),
  report_timestamp: z.string(),
  received_at: z.string(),
  created_at: z.string(),
})

export type InstanceReportRecord = z.infer<typeof instanceReportRecordSchema>

// 实例上报记录列表响应
export const instanceReportListResponseSchema = z.object({
  data: z.array(instanceReportRecordSchema),
  pagination: paginationSchema,
  timestamp: z.number(),
  trace_id: z.string(),
})

export type InstanceReportListResponse = z.infer<typeof instanceReportListResponseSchema>

// 获取实例上报记录参数
export const getInstanceReportsParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
})

export type GetInstanceReportsParams = z.infer<typeof getInstanceReportsParamsSchema>
