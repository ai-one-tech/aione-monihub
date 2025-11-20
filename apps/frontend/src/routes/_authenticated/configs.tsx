import z from 'zod'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { createFileRoute } from '@tanstack/react-router'
import { Configs } from '@/features/configs'

const configsSearchSchema = z.object({
  page: z.number().optional().catch(DEFAULT_PAGE),
  pageSize: z.number().optional().catch(DEFAULT_PAGE_SIZE),
  search: z.string().optional().catch(''),
  environment: z.string().optional().catch(''),
  config_type: z.string().optional().catch(''),
  all_versions: z.boolean().optional().catch(false),
})

export const Route = createFileRoute('/_authenticated/configs')({
  validateSearch: configsSearchSchema,
  component: Configs,
})