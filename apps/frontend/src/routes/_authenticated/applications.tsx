import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { Applications } from '@/features/applications'

const applicationsSearchSchema = z.object({
  page: z.number().optional().catch(DEFAULT_PAGE),
  pageSize: z.number().optional().catch(DEFAULT_PAGE_SIZE),
  // API 支持的查询参数
  search: z.string().optional().catch(''),
  status: z.string().optional().catch(''),
  project_id: z.string().optional().catch(''),
  tech_stack: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/applications')({
  validateSearch: applicationsSearchSchema,
  component: Applications,
})
