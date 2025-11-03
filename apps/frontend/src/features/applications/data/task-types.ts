import { z } from 'zod'

/**
 * 任务类型定义
 */
export const TASK_TYPES = {
  EXECUTE_COMMAND: 'execute_command',
  RESTART_SERVICE: 'restart_service',
  COLLECT_LOGS: 'collect_logs',
  UPDATE_CONFIG: 'update_config',
  FILE_TRANSFER: 'file_transfer',
} as const

export type TaskType = typeof TASK_TYPES[keyof typeof TASK_TYPES]

/**
 * 任务类型选项
 */
export const TASK_TYPE_OPTIONS = [
  { value: TASK_TYPES.EXECUTE_COMMAND, label: '执行命令', icon: 'Terminal' },
  { value: TASK_TYPES.RESTART_SERVICE, label: '重启服务', icon: 'RefreshCw' },
  { value: TASK_TYPES.COLLECT_LOGS, label: '采集日志', icon: 'FileText' },
  { value: TASK_TYPES.UPDATE_CONFIG, label: '更新配置', icon: 'Settings' },
  { value: TASK_TYPES.FILE_TRANSFER, label: '文件传输', icon: 'Upload' },
] as const

/**
 * 执行命令任务参数
 */
export const executeCommandSchema = z.object({
  command: z.string().min(1, '命令不能为空'),
  workdir: z.string().optional(),
  env: z.record(z.string()).optional(),
})

export type ExecuteCommandParams = z.infer<typeof executeCommandSchema>

/**
 * 重启服务任务参数
 */
export const restartServiceSchema = z.object({
  service_name: z.string().min(1, '服务名称不能为空'),
  wait_timeout: z.number().positive().optional(),
})

export type RestartServiceParams = z.infer<typeof restartServiceSchema>

/**
 * 采集日志任务参数
 */
export const collectLogsSchema = z.object({
  log_path: z.string().min(1, '日志路径不能为空'),
  lines: z.number().positive().optional(),
  pattern: z.string().optional(),
})

export type CollectLogsParams = z.infer<typeof collectLogsSchema>

/**
 * 更新配置任务参数
 */
export const updateConfigSchema = z.object({
  config_path: z.string().min(1, '配置文件路径不能为空'),
  content: z.string().min(1, '配置内容不能为空'),
  backup: z.boolean().optional(),
})

export type UpdateConfigParams = z.infer<typeof updateConfigSchema>

/**
 * 文件传输任务参数
 */
export const fileTransferSchema = z.object({
  action: z.enum(['upload', 'download']),
  source: z.string().min(1, '源路径不能为空'),
  target: z.string().min(1, '目标路径不能为空'),
  overwrite: z.boolean().optional(),
})

export type FileTransferParams = z.infer<typeof fileTransferSchema>

/**
 * 任务参数联合类型
 */
export type TaskParams = 
  | ExecuteCommandParams
  | RestartServiceParams
  | CollectLogsParams
  | UpdateConfigParams
  | FileTransferParams

/**
 * 根据任务类型获取对应的Schema
 */
export function getTaskParamsSchema(taskType: string) {
  switch (taskType) {
    case TASK_TYPES.EXECUTE_COMMAND:
      return executeCommandSchema
    case TASK_TYPES.RESTART_SERVICE:
      return restartServiceSchema
    case TASK_TYPES.COLLECT_LOGS:
      return collectLogsSchema
    case TASK_TYPES.UPDATE_CONFIG:
      return updateConfigSchema
    case TASK_TYPES.FILE_TRANSFER:
      return fileTransferSchema
    default:
      return z.any()
  }
}

/**
 * 获取任务类型的默认参数
 */
export function getDefaultTaskParams(taskType: string): any {
  switch (taskType) {
    case TASK_TYPES.EXECUTE_COMMAND:
      return { command: '' }
    case TASK_TYPES.RESTART_SERVICE:
      return { service_name: '' }
    case TASK_TYPES.COLLECT_LOGS:
      return { log_path: '', lines: 100 }
    case TASK_TYPES.UPDATE_CONFIG:
      return { config_path: '', content: '', backup: true }
    case TASK_TYPES.FILE_TRANSFER:
      return { action: 'upload', source: '', target: '', overwrite: false }
    default:
      return {}
  }
}
