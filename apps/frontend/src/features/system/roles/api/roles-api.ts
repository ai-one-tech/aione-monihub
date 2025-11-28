import { apiClient } from '@/lib/api-client'
import {
  type GetRolesParams,
  type RoleListResponse,
  type CreateRoleRequest,
  type UpdateRoleRequest,
  type ApiRoleResponse,
} from '../data/api-schema'

class RolesApi {
  /**
   * 获取角色列表
   */
  async getRoles(params: GetRolesParams = {}): Promise<RoleListResponse> {
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

    const queryString = searchParams.toString()
    const endpoint = `/api/roles${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get<RoleListResponse>(endpoint)
    return response.data
  }

  /**
   * 创建角色
   */
  async createRole(roleData: CreateRoleRequest): Promise<ApiRoleResponse> {
    const response = await apiClient.post<ApiRoleResponse>(
      '/api/roles',
      roleData
    )
    return response.data
  }

  /**
   * 更新角色
   */
  async updateRole(
    roleId: string,
    roleData: UpdateRoleRequest
  ): Promise<ApiRoleResponse> {
    const response = await apiClient.put<ApiRoleResponse>(
      `/api/roles/${roleId}`,
      roleData
    )
    return response.data
  }

  /**
   * 删除角色
   */
  async deleteRole(roleId: string): Promise<void> {
    await apiClient.delete(`/api/roles/${roleId}`)
  }

  /**
   * 获取角色详情
   */
  async getRoleById(roleId: string): Promise<ApiRoleResponse> {
    const response = await apiClient.get<ApiRoleResponse>(
      `/api/roles/${roleId}`
    )
    return response.data
  }
}

export const rolesApi = new RolesApi()
