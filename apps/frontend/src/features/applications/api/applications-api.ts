import { 
  type GetApplicationsParams, 
  type ApplicationListResponse, 
  type ApplicationDetailResponse, 
  type UpdateApplicationRequest, 
  type CreateApplicationRequest,
  type TaskCreateRequest,
  type TaskResponse,
  type TaskListResponse,
  type TaskRecordListResponse,
  type TaskInstanceWithResultResponse,
  type GetTasksParams,
  type GetTaskRecordsParams
} from '../data/api-schema'
import { apiClient } from '@/lib/api-client'

class ApplicationsApi {
  /**
   * 获取应用列表
   */
  async getApplications(params: GetApplicationsParams = {}): Promise<ApplicationListResponse> {
    const searchParams = new URLSearchParams()

    if (params.page !== undefined) {
      searchParams.append('page', params.page.toString())
    }
    if (params.limit !== undefined) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.search) {
      searchParams.append('search', params.search)
    }
    if (params.status) {
      searchParams.append('status', params.status)
    }
    if (params.project_id) {
      searchParams.append('project_id', params.project_id)
    }
    if ((params as any).tech_stack) {
      searchParams.append('tech_stack', (params as any).tech_stack as string)
    }

    const queryString = searchParams.toString()
    const endpoint = `/api/applications${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get<ApplicationListResponse>(endpoint)
    return response.data
  }

  /**
   * 创建应用
   */
  async createApplication(applicationData: CreateApplicationRequest): Promise<ApplicationDetailResponse> {
    const response = await apiClient.post<ApplicationDetailResponse>('/api/applications', applicationData)
    return response.data
  }

  /**
   * 更新应用
   */
  async updateApplication(applicationId: string, applicationData: UpdateApplicationRequest): Promise<ApplicationDetailResponse> {
    const response = await apiClient.put<ApplicationDetailResponse>(`/api/applications/${applicationId}`, applicationData)
    return response.data
  }

  /**
   * 删除应用
   */
  async deleteApplication(applicationId: string): Promise<any> {
    const response = await apiClient.delete(`/api/applications/${applicationId}`)
    return response.data
  }

  /**
   * 获取应用详情
   */
  async getApplicationById(applicationId: string): Promise<ApplicationDetailResponse> {
    const response = await apiClient.get<ApplicationDetailResponse>(`/api/applications/${applicationId}`)
    return response.data
  }

  /**
   * 创建任务
   */
  async createTask(taskData: TaskCreateRequest): Promise<TaskResponse> {
    const response = await apiClient.post<TaskResponse>('/api/instances/tasks', taskData)
    return response.data
  }

  /**
   * 获取任务列表
   */
  async getTasks(params: GetTasksParams = {}): Promise<TaskListResponse> {
    const searchParams = new URLSearchParams()

    if (params.page !== undefined) {
      searchParams.append('page', params.page.toString())
    }
    if (params.limit !== undefined) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.status) {
      searchParams.append('status', params.status)
    }
    if (params.task_type) {
      searchParams.append('task_type', params.task_type)
    }
    if (params.application_id) {
      searchParams.append('application_id', params.application_id)
    }

    const queryString = searchParams.toString()
    const endpoint = `/api/instances/tasks${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get<TaskListResponse>(endpoint)
    return response.data
  }

  /**
   * 获取单个任务详情
   */
  async getTaskById(taskId: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/api/instances/tasks/${taskId}`)
    return response.data
  }

  /**
   * 获取任务执行记录
   */
  async getTaskRecords(taskId: string, params: GetTaskRecordsParams = {}): Promise<TaskRecordListResponse> {
    const searchParams = new URLSearchParams()

    if (params.page !== undefined) {
      searchParams.append('page', params.page.toString())
    }
    if (params.limit !== undefined) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.status) {
      searchParams.append('status', params.status)
    }

    const queryString = searchParams.toString()
    const endpoint = `/api/instances/tasks/${taskId}/records${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get<TaskRecordListResponse>(endpoint)
    return response.data
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<any> {
    const response = await apiClient.post(`/api/instances/tasks/${taskId}/cancel`, {})
    return response.data
  }

  /**
   * 重试任务记录
   */
  async retryTaskRecord(recordId: string): Promise<any> {
    const response = await apiClient.post(`/api/instances/task-records/${recordId}/retry`, {})
    return response.data
  }

  /**
   * 将任务记录置为待执行
   */
  async setTaskRecordPending(recordId: string): Promise<any> {
    const response = await apiClient.post(`/api/instances/task-records/${recordId}/set-pending`, {})
    return response.data
  }

  /**
   * 获取任务关联的所有实例及其执行结果
   */
  async getTaskInstancesWithResults(taskId: string): Promise<TaskInstanceWithResultResponse> {
    const response = await apiClient.get<TaskInstanceWithResultResponse>(`/api/instances/tasks/${taskId}/instances-with-results`)
    return response.data
  }
}

export const applicationsApi = new ApplicationsApi()
