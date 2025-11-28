import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { SystemRoles } from '@/features/system/roles'

const systemRolesSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  pageSize: z.coerce.number().catch(10),
  // API 支持的查询参数
  search: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/system/roles')({
  validateSearch: systemRolesSearchSchema,
  component: SystemRoles,
})
