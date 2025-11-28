import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { projectsApi } from '../api/projects-api'
import {
  type GetProjectsParams,
  type CreateProjectRequest,
  type UpdateProjectRequest,
} from '../data/api-schema'

// 查询键
export const projectsQueryKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsQueryKeys.all, 'list'] as const,
  list: (params: GetProjectsParams) =>
    [...projectsQueryKeys.lists(), params] as const,
  details: () => [...projectsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectsQueryKeys.details(), id] as const,
}

// 获取项目列表
export function useProjectsQuery(params: GetProjectsParams) {
  return useQuery({
    queryKey: projectsQueryKeys.list(params),
    queryFn: () => projectsApi.getProjects(params),
    staleTime: 5 * 60 * 1000, // 5分钟
  })
}

// 获取项目详情
export function useProjectQuery(projectId: string) {
  return useQuery({
    queryKey: projectsQueryKeys.detail(projectId),
    queryFn: () => projectsApi.getProjectById(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5分钟
  })
}

// 创建项目
export function useCreateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectsApi.createProject(data),
    onSuccess: () => {
      // 刷新项目列表
      queryClient.invalidateQueries({ queryKey: projectsQueryKeys.lists() })
      toast.success('项目创建成功')
    },
    onError: async (error: any) => {
      let message = error?.message || '创建项目失败'
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

// 更新项目
export function useUpdateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      projectsApi.updateProject(id, data),
    onSuccess: (_, variables) => {
      // 刷新项目列表和详情
      queryClient.invalidateQueries({ queryKey: projectsQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: projectsQueryKeys.detail(variables.id),
      })
      toast.success('项目更新成功')
    },
    onError: async (error: any) => {
      let message = error?.message || '更新项目失败'
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

// 删除项目
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => projectsApi.deleteProject(projectId),
    onSuccess: () => {
      // 刷新项目列表
      queryClient.invalidateQueries({ queryKey: projectsQueryKeys.lists() })
      toast.success('项目删除成功')
    },
    onError: (error: any) => {
      toast.error(error?.message || '删除项目失败')
    },
  })
}
