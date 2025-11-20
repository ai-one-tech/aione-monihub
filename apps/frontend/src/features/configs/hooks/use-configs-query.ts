import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { getConfigs, createConfig, updateConfig, deleteConfig, type ConfigListQuery, type ConfigCreateRequest, type ConfigUpdateRequest, type ConfigResponse } from '../api/configs-api'
import { toast } from 'sonner'

export function useConfigsQuery() {
  const router = useRouter()
  const search = router.state.location.search as unknown as ConfigListQuery
  const params: ConfigListQuery = {
    page: search?.page ?? 1,
    limit: search?.pageSize ?? 10,
    search: search?.search ?? '',
    config_type: search?.config_type ?? '',
    environment: search?.environment ?? '',
    all_versions: search?.all_versions ?? false,
  }
  return useQuery({
    queryKey: ['configs', params],
    queryFn: async () => (await getConfigs(params)).data,
  })
}

export function useCreateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ConfigCreateRequest) => (await createConfig(data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['configs'] })
    },
    onError: (e: unknown) => {
      toast.error('创建配置失败')
      console.error(e)
    },
  })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { configId: string; data: ConfigUpdateRequest }) => (await updateConfig(payload.configId, payload.data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['configs'] })
    },
    onError: (e: unknown) => {
      toast.error('更新配置失败')
      console.error(e)
    },
  })
}

export function useDeleteConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (configId: string) => (await deleteConfig(configId)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['configs'] })
    },
    onError: (e: unknown) => {
      toast.error('删除配置失败')
      console.error(e)
    },
  })
}