import { useQuery } from '@tanstack/react-query'
import { usersApi } from '../api/users-api'

/**
 * 用户详情查询hook
 */
export function useUserDetailQuery(userId: string | null) {
  return useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('用户ID不能为空')
      }
      return usersApi.getUserById(userId)
    },
    enabled: !!userId, // 只有当userId存在时才执行查询
    staleTime: 30 * 1000, // 30秒缓存
    gcTime: 5 * 60 * 1000, // 5分钟垃圾回收
  })
}
