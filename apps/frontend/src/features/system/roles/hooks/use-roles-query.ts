import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rolesApi } from '../api/roles-api'
import { type GetRolesParams, type CreateRoleRequest, type UpdateRoleRequest } from '../data/api-schema'
import { toast } from 'sonner'

// 角色列表查询
export function useRolesQuery(params: GetRolesParams) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => rolesApi.getRoles(params),
    staleTime: 5 * 60 * 1000, // 5分钟
  })
}

// 单个角色查询
export function useRoleQuery(roleId: string) {
  return useQuery({
    queryKey: ['role', roleId],
    queryFn: () => rolesApi.getRoleById(roleId),
    enabled: !!roleId,
    staleTime: 0, // 禁用缓存，每次查询都是新鲜数据
  })
}

// 创建角色
export function useCreateRoleMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('角色创建成功')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || '创建角色失败')
    },
  })
}

// 更新角色
export function useUpdateRoleMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateRoleRequest }) => 
      rolesApi.updateRole(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['role'] })
      toast.success('角色更新成功')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || '更新角色失败')
    },
  })
}

// 删除角色
export function useDeleteRoleMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (roleId: string) => rolesApi.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('角色删除成功')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || '删除角色失败')
    },
  })
}