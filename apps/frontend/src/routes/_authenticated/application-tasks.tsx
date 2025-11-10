import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { ApplicationTasks } from '@/features/application-tasks'

const applicationTasksSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  applicationId: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/application-tasks')({
  validateSearch: applicationTasksSearchSchema,
  component: ApplicationTasks,
})