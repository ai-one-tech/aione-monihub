import { useQuery } from '@tanstack/react-query'
import { permissionsApi } from '../api/permissions-api'

export function usePermissionDetailQuery(permissionId: string | null) {
  return useQuery({
    queryKey: ['permission-detail', permissionId],
    queryFn: () => permissionsApi.getPermissionById(permissionId!),
    enabled: !!permissionId,
    staleTime: 30 * 1000, // 30秒缓存
    gcTime: 5 * 60 * 1000, // 5分钟垃圾回收
  })
}
