import { type GetPermissionsParams, type PermissionListResponse } from '../data/api-schema'
import { apiClient } from '@/lib/api-client'

class PermissionsApi {
  /**
   * 获取权限列表
   */
  async getPermissions(params: GetPermissionsParams = {}): Promise<PermissionListResponse> {
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
    if (params.permission_type) {
      searchParams.append('permission_type', params.permission_type)
    }
    if (params.resource) {
      searchParams.append('resource', params.resource)
    }

    const queryString = searchParams.toString()
    const endpoint = `/api/permissions${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get<PermissionListResponse>(endpoint)
    return response.data
  }

  /**
   * 创建权限
   */
  async createPermission(permissionData: any): Promise<any> {
    const response = await apiClient.post('/api/permissions', permissionData)
    return response.data
  }

  /**
   * 更新权限
   */
  async updatePermission(permissionId: string, permissionData: any): Promise<any> {
    const response = await apiClient.put(`/api/permissions/${permissionId}`, permissionData)
    return response.data
  }

  /**
   * 删除权限
   */
  async deletePermission(permissionId: string): Promise<any> {
    const response = await apiClient.delete(`/api/permissions/${permissionId}`)
    return response.data
  }

  /**
   * 获取权限详情
   */
  async getPermissionById(permissionId: string): Promise<any> {
    const response = await apiClient.get(`/api/permissions/${permissionId}`)
    return response.data
  }
}

export const permissionsApi = new PermissionsApi()