import { type GetApplicationsParams, type ApplicationListResponse, type ApplicationDetailResponse, type UpdateApplicationRequest, type CreateApplicationRequest } from '../data/api-schema'
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
}

export const applicationsApi = new ApplicationsApi()