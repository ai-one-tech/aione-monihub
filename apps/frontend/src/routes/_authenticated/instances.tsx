import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { Instances } from '@/features/instances'

const instancesSearchSchema = z.object({
  page: z.number().optional().catch(DEFAULT_PAGE),
  pageSize: z.number().optional().catch(DEFAULT_PAGE_SIZE),
  // API 支持的查询参数
  search: z.string().optional().catch(''),
  status: z.string().optional().catch(''),
  application_id: z.string().optional().catch(''),
  ip_address: z.string().optional().catch(''),
  public_ip: z.string().optional().catch(''),
  hostname: z.string().optional().catch(''),
  os_type: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/instances')({
  validateSearch: instancesSearchSchema,
  component: Instances,
})
