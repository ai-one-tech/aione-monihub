import z from 'zod'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { createFileRoute } from '@tanstack/react-router'
import { ApplicationTasks } from '@/features/application-tasks'

const applicationTasksSearchSchema = z.object({
  page: z.number().optional().catch(DEFAULT_PAGE),
  pageSize: z.number().optional().catch(DEFAULT_PAGE_SIZE),
  applicationId: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/application-tasks')({
  validateSearch: applicationTasksSearchSchema,
  component: ApplicationTasks,
})