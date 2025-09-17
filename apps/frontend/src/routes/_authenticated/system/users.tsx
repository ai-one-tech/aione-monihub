import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { SystemUsers } from '@/features/system/users'

const systemUsersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // API 支持的查询参数
  username: z.string().optional().catch(''),
  status: z.string().optional().catch(''),
  // 角色筛选 - 支持多选
  roles: z
    .array(z.string())
    .optional()
    .catch([]),
})

export const Route = createFileRoute('/_authenticated/system/users')({
  validateSearch: systemUsersSearchSchema,
  component: SystemUsers,
})