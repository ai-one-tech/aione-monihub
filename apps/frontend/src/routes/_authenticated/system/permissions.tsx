import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { SystemPermissions } from '@/features/system/permissions'

const systemPermissionsSearchSchema = z.object({
  page: z.coerce.number().catch(1),
  pageSize: z.coerce.number().catch(10),
  // API 支持的查询参数
  name: z.string().optional().catch(''),
  // 权限类型筛选 - 支持多选
  permission_type: z
    .union([
      z.string(),
      z.array(z.string())
    ])
    .optional()
    .catch([]),
  // 操作筛选 - 支持多选
  action: z
    .union([
      z.string(),
      z.array(z.string())
    ])
    .optional()
    .catch([]),
})

export const Route = createFileRoute('/_authenticated/system/permissions')({
  validateSearch: systemPermissionsSearchSchema,
  component: SystemPermissions,
})