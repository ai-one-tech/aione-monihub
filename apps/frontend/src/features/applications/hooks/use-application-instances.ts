import { useQuery } from '@tanstack/react-query'
import { instancesApi } from '@/features/instances/api/instances-api'

/**
 * 获取应用下的实例列表 Hook
 */
export function useApplicationInstances(applicationId: string) {
  return useQuery({
    queryKey: ['application-instances', applicationId],
    queryFn: () =>
      instancesApi.getInstances({
        application_id: applicationId,
        online_status: 'online',
        limit: 100, // 获取最多100个实例
      }),
    enabled: !!applicationId,
    staleTime: 1000 * 60 * 5, // 5分钟缓存
  })
}
