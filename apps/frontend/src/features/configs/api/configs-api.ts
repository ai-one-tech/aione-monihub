import { apiClient } from '@/lib/api-client'

export type ConfigType = 'object' | 'array' | 'html' | 'text'

export type ConfigResponse = {
  id: string
  code: string
  environment: 'dev' | 'test' | 'staging' | 'prod'
  name: string
  config_type: ConfigType
  content: string
  description: string
  version: number
  created_at: string
  updated_at: string
  generate_values: boolean
  schema?: string | null
}

export type ConfigListResponse = {
  data: ConfigResponse[]
  pagination: { page: number; limit: number; total: number }
  timestamp: number
  trace_id: string
}

export type ConfigCreateRequest = {
  code: string
  environment: string
  name: string
  config_type: ConfigType
  content: string
  description: string
  generate_values?: boolean
  schema?: string | null
}

export type ConfigUpdateRequest = ConfigCreateRequest

export type ConfigListQuery = {
  page?: number
  limit?: number
  search?: string
  config_type?: string
  environment?: string
  all_versions?: boolean
}

export function getConfigs(params: ConfigListQuery) {
  return apiClient.get<ConfigListResponse>('/api/configs', { params })
}

export function createConfig(data: ConfigCreateRequest) {
  return apiClient.post<ConfigResponse>('/api/configs', data)
}

export function updateConfig(configId: string, data: ConfigUpdateRequest) {
  return apiClient.put<ConfigResponse>(`/api/configs/${configId}`, data)
}

export function deleteConfig(configId: string) {
  return apiClient.delete<void>(`/api/configs/${configId}`)
}