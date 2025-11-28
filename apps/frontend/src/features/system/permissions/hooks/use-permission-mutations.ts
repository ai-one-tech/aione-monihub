import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { permissionsApi } from '../api/permissions-api'
import {
  type CreatePermissionRequest,
  type UpdatePermissionRequest,
} from '../data/api-schema'

export function useCreatePermissionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePermissionRequest) =>
      permissionsApi.createPermission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-permissions'] })
      toast.success('权限创建成功')
    },
    onError: (error: any) => {
      console.error('创建权限失败:', error)
      toast.error(error.response?.data?.message || '创建权限失败')
    },
  })
}

export function useUpdatePermissionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      permissionId,
      permissionData,
    }: {
      permissionId: string
      permissionData: UpdatePermissionRequest
    }) => permissionsApi.updatePermission(permissionId, permissionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-permissions'] })
      queryClient.invalidateQueries({ queryKey: ['permission-detail'] })
      toast.success('权限更新成功')
    },
    onError: (error: any) => {
      console.error('更新权限失败:', error)
      toast.error(error.response?.data?.message || '更新权限失败')
    },
  })
}

export function useDeletePermissionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (permissionId: string) =>
      permissionsApi.deletePermission(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-permissions'] })
      toast.success('权限删除成功')
    },
    onError: (error: any) => {
      console.error('删除权限失败:', error)
      toast.error(error.response?.data?.message || '删除权限失败')
    },
  })
}
