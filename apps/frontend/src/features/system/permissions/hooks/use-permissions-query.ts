import { useQuery } from '@tanstack/react-query'
import { permissionsApi } from '../api/permissions-api'
import { type GetPermissionsParams } from '../data/api-schema'

export function usePermissionsQuery(params: GetPermissionsParams) {
  return useQuery({
    queryKey: ['system-permissions', params],
    queryFn: () => permissionsApi.getPermissions(params),
    staleTime: 30 * 1000, // 30秒缓存
    gcTime: 5 * 60 * 1000, // 5分钟垃圾回收
  })
}
