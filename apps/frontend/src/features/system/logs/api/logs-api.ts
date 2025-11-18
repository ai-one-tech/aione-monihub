import { type GetLogsParams, type LogListResponse } from '../data/api-schema'
import { apiClient } from '@/lib/api-client'

class LogsApi {
  async getLogs(params: GetLogsParams = {}): Promise<LogListResponse> {
    const searchParams = new URLSearchParams()

    if (params.page !== undefined) searchParams.append('page', params.page.toString())
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString())
    if (params.log_level) searchParams.append('log_level', params.log_level)
    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.source) searchParams.append('source', params.source)
    if (params.log_type) searchParams.append('log_type', params.log_type)
    if (params.user_id) searchParams.append('user_id', params.user_id)
    if (params.agent_instance_id) searchParams.append('agent_instance_id', params.agent_instance_id)
    if (params.instance_id) searchParams.append('instance_id', params.instance_id)
    if (params.url) searchParams.append('url', params.url)
    if (params.method) searchParams.append('method', params.method)
    if (params.status) searchParams.append('status', params.status)

    const queryString = searchParams.toString()
    const endpoint = `/api/logs${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<LogListResponse>(endpoint)
    return response.data
  }

  getExportUrl(params: GetLogsParams = {}): string {
    const searchParams = new URLSearchParams()
    if (params.page !== undefined) searchParams.append('page', params.page.toString())
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString())
    if (params.log_level) searchParams.append('log_level', params.log_level)
    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.source) searchParams.append('source', params.source)
    if (params.log_type) searchParams.append('log_type', params.log_type)
    if (params.user_id) searchParams.append('user_id', params.user_id)
    if (params.agent_instance_id) searchParams.append('agent_instance_id', params.agent_instance_id)
    if (params.instance_id) searchParams.append('instance_id', params.instance_id)
    if (params.url) searchParams.append('url', params.url)
    if (params.method) searchParams.append('method', params.method)
    if (params.status) searchParams.append('status', params.status)
    const queryString = searchParams.toString()
    return `/api/logs/export${queryString ? `?${queryString}` : ''}`
  }
  
  
  async exportLogs(params: GetLogsParams = {}): Promise<Blob> {
    const sp = new URLSearchParams()
    if (params.log_level) sp.append('log_level', params.log_level)
    if (params.keyword) sp.append('keyword', params.keyword)
    if (params.start_date) sp.append('start_date', params.start_date)
    if (params.end_date) sp.append('end_date', params.end_date)
    const qs = sp.toString()
    const endpoint = `/api/logs/export${qs ? `?${qs}` : ''}`
    const response = await apiClient.get<Blob>(endpoint, { responseType: 'blob' as any })
    return response.data
  }
}

export const logsApi = new LogsApi()

