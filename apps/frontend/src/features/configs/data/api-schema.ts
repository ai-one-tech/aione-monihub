import { z } from 'zod'
import type { ConfigType } from '../api/configs-api'

export const CONFIG_TYPE_OPTIONS: ConfigType[] = [
  'object',
  'array',
  'html',
  'text',
]

export const createConfigRequestSchema = z.object({
  code: z.string().min(1, '请输入配置代码'),
  environment: z.enum(['dev', 'test', 'staging', 'prod'], {
    required_error: '请选择环境',
  }),
  name: z.string().min(1, '请输入配置名称'),
  config_type: z.enum(['object', 'array', 'html', 'text'], {
    required_error: '请选择配置类型',
  }),
  content: z.string().min(1, '请输入配置内容'),
  description: z.string().optional().default(''),
  generate_values: z.boolean().optional().default(false),
  schema: z.string().optional().nullable(),
})

export type CreateConfigRequest = z.infer<typeof createConfigRequestSchema>
