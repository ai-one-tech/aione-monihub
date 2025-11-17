import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { SystemLogs } from '@/features/system/logs'

const systemLogsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
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

