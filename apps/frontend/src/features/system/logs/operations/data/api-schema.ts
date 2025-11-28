import { z } from 'zod'

export const auditLogItemSchema = z.object({
  id: z.string(),
  user: z.string(),
  timestamp: z.string(),
  ip: z.string(),
  trace_id: z.string().optional(),
  table: z.string(),
  operation: z.string(),
})

export type AuditLogItem = z.infer<typeof auditLogItemSchema>

export const changeEntrySchema = z.object({
  path: z.string(),
  type: z.string(),
  before: z.any().optional(),
  after: z.any().optional(),
})

export type ChangeEntry = z.infer<typeof changeEntrySchema>

export const auditLogDetailSchema = z.object({
  id: z.string(),
  user: z.string(),
  timestamp: z.string(),
  ip: z.string(),
  trace_id: z.string().optional(),
  table: z.string(),
  operation: z.string(),
  before: z.any().nullable().optional(),
  after: z.any().nullable().optional(),
  diff: z.array(changeEntrySchema),
})

export type AuditLogDetail = z.infer<typeof auditLogDetailSchema>

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
})

export type Pagination = z.infer<typeof paginationSchema>

export const auditLogListResponseSchema = z.object({
  data: z.array(auditLogItemSchema),
  pagination: paginationSchema,
  timestamp: z.number(),
  trace_id: z.string(),
})

export type AuditLogListResponse = z.infer<typeof auditLogListResponseSchema>

export const getOperationLogsParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  user: z.string().optional(),
  ip: z.string().optional(),
  trace_id: z.string().optional(),
  table: z.string().optional(),
  operation: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export type GetOperationLogsParams = z.infer<
  typeof getOperationLogsParamsSchema
>
