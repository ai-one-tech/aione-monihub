import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { applicationsApi } from '../api/applications-api'
import {
  type TaskCreateRequest,
  type GetTasksParams,
  type GetTaskRecordsParams,
} from '../data/api-schema'

/**
 * 创建任务 Hook
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: applicationsApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('任务创建成功')
    },
    onError: (error: any) => {
      toast.error(error?.message || '任务创建失败')
    },
  })
}

/**
 * 获取任务列表 Hook
 */
export function useTasksQuery(params: GetTasksParams = {}) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => applicationsApi.getTasks(params),
    staleTime: 1000 * 60 * 1, // 1分钟缓存
  })
}

/**
 * 获取单个任务详情 Hook
 */
export function useTaskDetails(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => applicationsApi.getTaskById(taskId),
    enabled: !!taskId,
  })
}

/**
 * 获取任务结果列表 Hook (别名)
 */
export function useTaskResults(taskId: string) {
  return useTaskRecords(taskId)
}

/**
 * 获取任务执行记录 Hook
 */
export function useTaskRecords(
  taskId: string,
  params: GetTaskRecordsParams = {}
) {
  return useQuery({
    queryKey: ['task-records', taskId, params],
    queryFn: () => applicationsApi.getTaskRecords(taskId, params),
    enabled: !!taskId,
    refetchInterval: (data) => {
      // 如果有任务正在执行，每3秒刷新一次
      const hasRunning = data?.data.some((record) =>
        ['pending', 'dispatched', 'running'].includes(record.status)
      )
      return hasRunning ? 3000 : false
    },
  })
}

/**
 * 取消任务 Hook
 */
export function useCancelTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: applicationsApi.cancelTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-records'] })
      toast.success('任务已取消')
    },
    onError: (error: any) => {
      toast.error(error?.message || '取消任务失败')
    },
  })
}

/**
 * 重试任务记录 Hook
 */
export function useRetryTaskRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: applicationsApi.retryTaskRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-records'] })
      toast.success('任务重试成功')
    },
    onError: (error: any) => {
      toast.error(error?.message || '任务重试失败')
    },
  })
}
