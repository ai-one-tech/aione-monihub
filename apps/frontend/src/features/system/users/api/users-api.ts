import { type GetUsersParams, type UserListResponse, type UserDetailResponse, type UpdateUserRequest, type CreateUserRequest } from '../data/api-schema'
import { apiClient } from '@/lib/api-client'

class UsersApi {
  /**
   * 获取用户列表
   */
  async getUsers(params: GetUsersParams = {}): Promise<UserListResponse> {
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
    const endpoint = `/api/users${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get<UserListResponse>(endpoint)
    return response.data
  }

  /**
   * 创建用户
   */
  async createUser(userData: CreateUserRequest): Promise<UserDetailResponse> {
    const response = await apiClient.post<UserDetailResponse>('/api/users', userData)
    return response.data
  }

  /**
   * 更新用户
   */
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<UserDetailResponse> {
    const response = await apiClient.put<UserDetailResponse>(`/api/users/${userId}`, userData)
    return response.data
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: string): Promise<any> {
    const response = await apiClient.delete(`/api/users/${userId}`)
    return response.data
  }

  /**
   * 获取用户详情
   */
  async getUserById(userId: string): Promise<UserDetailResponse> {
    const response = await apiClient.get<UserDetailResponse>(`/api/users/${userId}`)
    return response.data
  }
}

export const usersApi = new UsersApi()