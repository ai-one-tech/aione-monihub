import { useQuery } from '@tanstack/react-query'
import { instancesApi } from '../api/instances-api'
import { type GetInstanceReportsParams } from '../data/api-schema'

/**
 * 实例上报记录查询 Hook
 */
export function useInstanceReports(instanceId: string, params: GetInstanceReportsParams = {}) {
  return useQuery({
    queryKey: ['instance-reports', instanceId, params],
    queryFn: () => instancesApi.getInstanceReports(instanceId, params),
    enabled: !!instanceId,
    staleTime: 1000 * 60 * 5, // 5分钟缓存
  })
}
