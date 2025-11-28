import { useQuery } from '@tanstack/react-query'
import { logsApi } from '../api/logs-api'
import { type GetLogsParams } from '../data/api-schema'

export function useLogsQuery(params: GetLogsParams) {
  return useQuery({
    queryKey: ['system-logs', params],
    queryFn: () => logsApi.getLogs(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
