import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Applications } from '@/features/applications'

const applicationsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // API 支持的查询参数
  search: z.string().optional().catch(''),
  status: z.string().optional().catch(''),
  project_id: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/applications')({
  validateSearch: applicationsSearchSchema,
  component: Applications,
})
