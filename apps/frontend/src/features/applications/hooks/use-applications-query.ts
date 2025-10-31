import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '../api/applications-api'
import { type GetApplicationsParams } from '../data/api-schema'
import { useDebounce } from '@/hooks/use-debounce'

/**
 * 应用列表查询 Hook
 */
export function useApplicationsQuery(params: GetApplicationsParams = {}) {
  // 对搜索参数进行防抖处理
  const debouncedSearch = useDebounce(params.search, 2000)
  
  const debouncedParams = {
    ...params,
    search: debouncedSearch,
  }

  return useQuery({
    queryKey: ['applications', debouncedParams],
    queryFn: () => applicationsApi.getApplications(debouncedParams),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5分钟
  })
}

/**
 * 应用详情查询 Hook
 */
export function useApplicationQuery(applicationId: string) {
  return useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationsApi.getApplicationById(applicationId),
    enabled: !!applicationId,
  })
}

/**
 * 创建应用 Hook
 */
export function useCreateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: applicationsApi.createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

/**
 * 更新应用 Hook
 */
export function useUpdateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, data }: { applicationId: string; data: any }) =>
      applicationsApi.updateApplication(applicationId, data),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
    },
  })
}

/**
 * 删除应用 Hook
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: applicationsApi.deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}