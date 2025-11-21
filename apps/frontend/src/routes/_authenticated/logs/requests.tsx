import { z } from 'zod'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { createFileRoute } from '@tanstack/react-router'
import { RequestLogs } from '@/features/system/logs/request'

const requestLogsSearchSchema = z.object({
  page: z.number().optional().catch(DEFAULT_PAGE),
  pageSize: z.number().optional().catch(DEFAULT_PAGE_SIZE),
  keyword: z.string().optional().catch(''),
  url: z.string().optional().catch(''),
  method: z.string().optional().catch(''),
  status: z.string().optional().catch(''),
  trace_id: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/logs/requests')({
  validateSearch: requestLogsSearchSchema,
  component: RequestLogs,
})