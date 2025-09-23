import { type GetProjectsParams, type ProjectListResponse, type ProjectDetailResponse, type UpdateProjectRequest, type CreateProjectRequest } from '../data/api-schema'
import { apiClient } from '@/lib/api-client'

class ProjectsApi {
  /**
   * 获取项目列表
   */
  async getProjects(params: GetProjectsParams = {}): Promise<ProjectListResponse> {
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

    const queryString = searchParams.toString()
    const endpoint = `/api/projects${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get<ProjectListResponse>(endpoint)
    return response.data
  }

  /**
   * 创建项目
   */
  async createProject(projectData: CreateProjectRequest): Promise<ProjectDetailResponse> {
    const response = await apiClient.post<ProjectDetailResponse>('/api/projects', projectData)
    return response.data
  }

  /**
   * 更新项目
   */
  async updateProject(projectId: string, projectData: UpdateProjectRequest): Promise<ProjectDetailResponse> {
    const response = await apiClient.put<ProjectDetailResponse>(`/api/projects/${projectId}`, projectData)
    return response.data
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<any> {
    const response = await apiClient.delete(`/api/projects/${projectId}`)
    return response.data
  }

  /**
   * 获取项目详情
   */
  async getProjectById(projectId: string): Promise<ProjectDetailResponse> {
    const response = await apiClient.get<ProjectDetailResponse>(`/api/projects/${projectId}`)
    return response.data
  }
}

export const projectsApi = new ProjectsApi()