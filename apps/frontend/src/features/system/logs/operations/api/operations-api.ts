import { apiClient } from '@/lib/api-client'
import { type AuditLogListResponse, type AuditLogDetail, type GetOperationLogsParams } from '../data/api-schema'

class OperationsLogsApi {
  async getOperationLogs(params: GetOperationLogsParams = {}): Promise<AuditLogListResponse> {
    const sp = new URLSearchParams()
    if (params.page !== undefined) sp.append('page', String(params.page))
    if (params.limit !== undefined) sp.append('limit', String(params.limit))
    if (params.user) sp.append('user', params.user)
    if (params.ip) sp.append('ip', params.ip)
    if (params.trace_id) sp.append('trace_id', params.trace_id)
    if (params.table) sp.append('table', params.table)
    if (params.operation) sp.append('operation', params.operation)
    if (params.start_date) sp.append('start_date', params.start_date)
    if (params.end_date) sp.append('end_date', params.end_date)
    const qs = sp.toString()
    const endpoint = `/api/audit/logs${qs ? `?${qs}` : ''}`
    const res = await apiClient.get<AuditLogListResponse>(endpoint)
    return res.data
  }

  async getOperationLogDetail(id: string): Promise<AuditLogDetail> {
    const res = await apiClient.get<AuditLogDetail>(`/api/audit/logs/${id}`)
    return res.data
  }
}

export const operationsLogsApi = new OperationsLogsApi()