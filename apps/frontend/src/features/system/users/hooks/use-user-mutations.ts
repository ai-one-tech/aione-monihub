import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../api/users-api'
import { type UpdateUserRequest, type CreateUserRequest } from '../data/api-schema'
import { toast } from 'sonner'

/**
 * 用户创建mutation hook
 */
export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userData: CreateUserRequest) => {
      return usersApi.createUser(userData)
    },
    onSuccess: () => {
      // 刷新用户列表
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
      
      toast.success('用户创建成功')
    },
    onError: (error) => {
      console.error('创建用户失败:', error)
      toast.error('创建用户失败')
    },
  })
}

/**
 * 用户更新mutation hook
 */
export function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: UpdateUserRequest }) => {
      return usersApi.updateUser(userId, userData)
    },
    onSuccess: (data, variables) => {
      // 更新用户详情缓存
      queryClient.setQueryData(['user-detail', variables.userId], data)
      
      // 刷新用户列表
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
      
      toast.success('用户信息更新成功')
    },
    onError: (error) => {
      console.error('更新用户失败:', error)
      toast.error('更新用户失败')
    },
  })
}

/**
 * 用户删除mutation hook
 */
export function useDeleteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => {
      return usersApi.deleteUser(userId)
    },
    onSuccess: () => {
      // 刷新用户列表
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
      
      toast.success('用户删除成功')
    },
    onError: (error) => {
      console.error('删除用户失败:', error)
      toast.error('删除用户失败')
    },
  })
}