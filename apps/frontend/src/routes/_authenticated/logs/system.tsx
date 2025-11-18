import z from 'zod'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { createFileRoute } from '@tanstack/react-router'
import { SystemLogs } from '@/features/system/logs'

const systemLogsSearchSchema = z.object({
  page: z.number().optional().catch(DEFAULT_PAGE),
  pageSize: z.number().optional().catch(DEFAULT_PAGE_SIZE),
  log_level: z.string().optional().catch(''),
  keyword: z.string().optional().catch(''),
  source: z.string().optional().catch(''),
  user_id: z.string().optional().catch(''),
  agent_instance_id: z.string().optional().catch(''),
  instance_id: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/logs/system')({
  validateSearch: systemLogsSearchSchema,
  component: SystemLogs,
})

