import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'
import { instancesApi } from '../api/instances-api'
import { type GetInstancesParams } from '../data/api-schema'

/**
 * 实例列表查询 Hook
 */
export function useInstancesQuery(params: GetInstancesParams = {}) {
  // 对搜索参数进行防抖处理
  const debouncedSearch = useDebounce(params.search)

  const debouncedParams = {
    ...params,
    search: debouncedSearch,
  }

  return useQuery({
    queryKey: ['instances', debouncedParams],
    queryFn: () => instancesApi.getInstances(debouncedParams),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5分钟
  })
}

/**
 * 实例详情查询 Hook
 */
export function useInstanceQuery(instanceId: string) {
  return useQuery({
    queryKey: ['instance', instanceId],
    queryFn: () => instancesApi.getInstanceById(instanceId),
    enabled: !!instanceId,
  })
}

// 移除创建实例 Hook
/*
export function useCreateInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: instancesApi.createInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      toast.success('实例创建成功')
    },
    onError: async (error: any) => {
      let message = '创建实例失败'
      if (error?.message) message = error.message

      let raw = ''
      if (error?.response && typeof error.response?.text === 'function') {
        try {
          raw = await error.response.text()
        } catch {}
      }

      toast.error(message)
    },
  })
}
*/

// 移除更新实例 Hook
/*
export function useUpdateInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ instanceId, data }: { instanceId: string; data: any }) =>
      instancesApi.updateInstance(instanceId, data),
    onSuccess: (_, { instanceId }) => {
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      queryClient.invalidateQueries({ queryKey: ['instance', instanceId] })
      toast.success('实例更新成功')
    },
    onError: async (error: any) => {
      let message = '更新实例失败'
      if (error?.message) message = error.message

      let raw = ''
      if (error?.response && typeof error.response?.text === 'function') {
        try {
          raw = await error.response.text()
        } catch {}
      }

      toast.error(message)
    },
  })
}
*/

/**
 * 删除实例 Hook
 */
export function useDeleteInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: instancesApi.deleteInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      toast.success('实例删除成功')
    },
    onError: (error: any) => {
      let message = '删除实例失败'
      if (error?.message) message = error.message
      toast.error(message)
    },
  })
}

/**
 * 启用实例 Hook
 */
export function useEnableInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: instancesApi.enableInstance,
    onSuccess: (_, instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      queryClient.invalidateQueries({ queryKey: ['instance', instanceId] })
      toast.success('实例已启用')
    },
    onError: (error: any) => {
      let message = '启用实例失败'
      if (error?.message) message = error.message
      toast.error(message)
    },
  })
}

/**
 * 禁用实例 Hook
 */
export function useDisableInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: instancesApi.disableInstance,
    onSuccess: (_, instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      queryClient.invalidateQueries({ queryKey: ['instance', instanceId] })
      toast.success('实例已禁用')
    },
    onError: (error: any) => {
      let message = '禁用实例失败'
      if (error?.message) message = error.message
      toast.error(message)
    },
  })
}

/**
 * 实例监控数据查询 Hook
 */
export function useInstanceMonitoringData(instanceId: string) {
  return useQuery({
    queryKey: ['instance-monitoring', instanceId],
    queryFn: () => instancesApi.getInstanceMonitoringData(instanceId),
    enabled: !!instanceId,
    staleTime: 1000 * 30, // 30秒
  })
}

/**
 * 更新实例配置 Hook
 */
export function useUpdateInstanceConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ instanceId, config }: { instanceId: string; config: any }) =>
      instancesApi.updateInstanceConfig(instanceId, config),
    onSuccess: (_, { instanceId }) => {
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      queryClient.invalidateQueries({ queryKey: ['instance', instanceId] })
      toast.success('配置已更新')
    },
    onError: (error: any) => {
      let message = '更新配置失败'
      if (error?.message) message = error.message
      toast.error(message)
    },
  })
}
