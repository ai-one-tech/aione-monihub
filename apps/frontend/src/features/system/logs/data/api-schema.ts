import { z } from 'zod'

export const logResponseSchema = z.object({
  id: z.string(),
  log_level: z.string(),
  application_id: z.string(),
  instance_id: z.string(),
  message: z.string(),
  ip_address: z.string(),
  user_agent: z.string(),
  log_source: z.string().nullable().optional(),
  timestamp: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  method: z.string().optional(),
  path: z.string().optional(),
  status: z.number().optional(),
  request_headers: z.any().optional(),
  request_body: z.any().optional(),
  response_body: z.any().optional(),
  duration_ms: z.number().optional(),
  trace_id: z.string().optional(),
})

export type LogResponse = z.infer<typeof logResponseSchema>

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  total_pages: z.number().optional(),
})

export type Pagination = z.infer<typeof paginationSchema>

export const logListResponseSchema = z.object({
  data: z.array(logResponseSchema),
  pagination: paginationSchema,
  timestamp: z.number(),
  trace_id: z.string(),
})

export type LogListResponse = z.infer<typeof logListResponseSchema>

export const getLogsParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  log_level: z.string().optional(),
  keyword: z.string().optional(),
  source: z.string().optional(),
  log_type: z.string().optional(),
  user_id: z.string().optional(),
  agent_instance_id: z.string().optional(),
  instance_id: z.string().optional(),
  application_id: z.string().optional(),
  url: z.string().optional(),
  method: z.string().optional(),
  status: z.string().optional(),
})

export type GetLogsParams = z.infer<typeof getLogsParamsSchema>

