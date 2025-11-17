import { useQuery } from '@tanstack/react-query'
import { operationsLogsApi } from '../api/operations-api'
import { type GetOperationLogsParams } from '../data/api-schema'

export function useOperationLogsQuery(params: GetOperationLogsParams) {
  return useQuery({
    queryKey: ['operation-logs', params],
    queryFn: () => operationsLogsApi.getOperationLogs(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}