import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { SystemPermissions } from '@/features/system/permissions'

const systemPermissionsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // API 支持的查询参数
  name: z.string().optional().catch(''),
  permission_type: z.string().optional().catch(''),
  resource: z.string().optional().catch(''),
  // 权限类型筛选 - 支持多选
  permission_types: z
    .array(z.string())
    .optional()
    .catch([]),
  // 资源筛选 - 支持多选
  resources: z
    .array(z.string())
    .optional()
    .catch([]),
})

export const Route = createFileRoute('/_authenticated/system/permissions')({
  validateSearch: systemPermissionsSearchSchema,
  component: SystemPermissions,
})