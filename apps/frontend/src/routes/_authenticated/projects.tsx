import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Projects } from '@/features/projects'

const projectsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // API 支持的查询参数
  search: z.string().optional().catch(''),
  status: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/projects')({
  validateSearch: projectsSearchSchema,
  component: Projects,
})