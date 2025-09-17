import { useQuery } from '@tanstack/react-query'
import { usersApi } from '../api/users-api'
import { type GetUsersParams } from '../data/api-schema'

export function useUsersQuery(params: GetUsersParams) {
  return useQuery({
    queryKey: ['system-users', params],
    queryFn: () => usersApi.getUsers(params),
    staleTime: 30 * 1000, // 30秒缓存
    gcTime: 5 * 60 * 1000, // 5分钟垃圾回收
  })
}