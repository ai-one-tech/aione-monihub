import { 
  type GetInstancesParams, 
  type InstanceListResponse, 
  type InstanceDetailResponse, 
  type UpdateInstanceRequest, 
  type CreateInstanceRequest,
  type GetInstanceReportsParams,
  type InstanceReportListResponse
} from '../data/api-schema'
import { apiClient } from '@/lib/api-client'

class InstancesApi {
  /**
   * 获取实例列表
   */
  async getInstances(params: GetInstancesParams = {}): Promise<InstanceListResponse> {
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
    if (params.application_id) {
      searchParams.append('application_id', params.application_id)
    }
    if (params.ip_address) {
      searchParams.append('ip_address', params.ip_address)
    }
    if (params.public_ip) {
      searchParams.append('public_ip', params.public_ip)
    }
    if (params.hostname) {
      searchParams.append('hostname', params.hostname)
    }
    if (params.os_type) {
      searchParams.append('os_type', params.os_type)
    }
    if (params.mac_address) {
      searchParams.append('mac_address', params.mac_address)
    }
    if (params.start_time) {
      searchParams.append('start_time', params.start_time)
    }
    if (params.end_time) {
      searchParams.append('end_time', params.end_time)
    }

    const queryString = searchParams.toString()
    const endpoint = `/api/instances${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get<InstanceListResponse>(endpoint)
    return response.data
  }

  /**
   * 创建实例
   */
  async createInstance(instanceData: CreateInstanceRequest): Promise<InstanceDetailResponse> {
    const response = await apiClient.post<InstanceDetailResponse>('/api/instances', instanceData)
    return response.data
  }

  /**
   * 更新实例
   */
  async updateInstance(instanceId: string, instanceData: UpdateInstanceRequest): Promise<InstanceDetailResponse> {
    const response = await apiClient.put<InstanceDetailResponse>(`/api/instances/${instanceId}`, instanceData)
    return response.data
  }

  /**
   * 删除实例
   */
  async deleteInstance(instanceId: string): Promise<any> {
    const response = await apiClient.delete(`/api/instances/${instanceId}`)
    return response.data
  }

  /**
   * 获取实例详情
   */
  async getInstanceById(instanceId: string): Promise<InstanceDetailResponse> {
    const response = await apiClient.get<InstanceDetailResponse>(`/api/instances/${instanceId}`)
    return response.data
  }

  /**
   * 启用实例
   */
  async enableInstance(instanceId: string): Promise<InstanceDetailResponse> {
    const response = await apiClient.post<InstanceDetailResponse>(`/api/instances/${instanceId}/enable`, {})
    return response.data
  }

  /**
   * 禁用实例
   */
  async disableInstance(instanceId: string): Promise<InstanceDetailResponse> {
    const response = await apiClient.post<InstanceDetailResponse>(`/api/instances/${instanceId}/disable`, {})
    return response.data
  }

  /**
   * 获取实例监控数据
   */
  async getInstanceMonitoringData(instanceId: string): Promise<any> {
    const response = await apiClient.get(`/api/instances/${instanceId}/monitoring`)
    return response.data
  }

  /**
   * 获取实例上报记录列表
   */
  async getInstanceReports(instanceId: string, params: GetInstanceReportsParams = {}): Promise<InstanceReportListResponse> {
    const searchParams = new URLSearchParams()

    if (params.page !== undefined) {
      searchParams.append('page', params.page.toString())
    }
    if (params.limit !== undefined) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.start_time) {
      searchParams.append('start_time', params.start_time)
    }
    if (params.end_time) {
      searchParams.append('end_time', params.end_time)
    }

    const queryString = searchParams.toString()
    const endpoint = `/api/instances/${instanceId}/reports${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get<InstanceReportListResponse>(endpoint)
    return response.data
  }
}

export const instancesApi = new InstancesApi()
