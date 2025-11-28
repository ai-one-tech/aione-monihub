import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { SystemUsers } from '@/features/system/users'

const systemUsersSearchSchema = z.object({
  page: z.number().optional().catch(DEFAULT_PAGE),
  pageSize: z.number().optional().catch(DEFAULT_PAGE_SIZE),
  // API 支持的查询参数
  username: z.string().optional().catch(''),
  status: z.string().optional().catch(''),
  // 角色筛选 - 逗号分隔字符串
  roles: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/system/users')({
  validateSearch: systemUsersSearchSchema,
  component: SystemUsers,
})
