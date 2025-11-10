import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Cpu, HardDrive, Activity } from 'lucide-react'
import { type InstanceReportRecord, type NetworkType } from '../data/api-schema'
import { InstanceReportDetailDialog } from './instances-report-detail-dialog'
import { DataTablePagination } from '@/components/data-table'

interface InstanceReportListProps {
  reports: InstanceReportRecord[]
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
}

export function InstanceReportList({
  reports,
  totalPages,
  currentPage,
  onPageChange,
}: InstanceReportListProps) {
  const [selectedReport, setSelectedReport] = useState<InstanceReportRecord | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const handleViewDetail = (report: InstanceReportRecord) => {
    setSelectedReport(report)
    setDetailDialogOpen(true)
  }

  const formatPercent = (value: string | undefined) => {
    if (!value) return '- -'
    return parseFloat(value).toFixed(1) + '%'
  }

  const formatBytes = (bytes: number | undefined, unit: 'MB' | 'GB') => {
    if (!bytes) return '- -'
    if (unit === 'GB') {
      return bytes.toFixed(1) + ' GB'
    }
    return Math.round(bytes) + ' MB'
  }

  if (reports.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <Activity className='h-12 w-12 text-muted-foreground mb-4' />
        <p className='text-sm text-muted-foreground'>暂无上报记录</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {reports.map((report) => (
        <Card key={report.id} className='hover:bg-accent/50 transition-colors'>
          <CardHeader className='pb-3'>
            <div className='flex items-start justify-between'>
              <div>
                <CardTitle className='text-base'>
                  {format(new Date(report.report_timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                </CardTitle>
                <CardDescription className='mt-1'>
                  Agent: {report.agent_type} {report.agent_version ? `v${report.agent_version}` : ''}
                </CardDescription>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handleViewDetail(report)}
              >
                <Eye className='h-4 w-4 mr-1' />
                详情
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {/* CPU 使用率 */}
              <div className='flex items-center gap-2'>
                <Cpu className='h-4 w-4 text-blue-500' />
                <div>
                  <p className='text-xs text-muted-foreground'>CPU</p>
                  <p className='text-sm font-medium'>{formatPercent(report.cpu_usage_percent)}</p>
                </div>
              </div>

              {/* 内存使用率 */}
              <div className='flex items-center gap-2'>
                <HardDrive className='h-4 w-4 text-green-500' />
                <div>
                  <p className='text-xs text-muted-foreground'>内存</p>
                  <p className='text-sm font-medium'>{formatPercent(report.memory_usage_percent)}</p>
                </div>
              </div>

              {/* 磁盘使用率 */}
              <div className='flex items-center gap-2'>
                <HardDrive className='h-4 w-4 text-orange-500' />
                <div>
                  <p className='text-xs text-muted-foreground'>磁盘</p>
                  <p className='text-sm font-medium'>{formatPercent(report.disk_usage_percent)}</p>
                </div>
              </div>

              {/* 操作系统 */}
              <div>
                <p className='text-xs text-muted-foreground'>系统</p>
                <div className='flex gap-1 mt-1'>
                  {report.os_type && (
                    <Badge variant='outline' className='text-xs'>
                      {report.os_type}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 网络信息 */}
            {(report.ip_address || report.public_ip || report.network_type) && (
              <div className='mt-3 pt-3 border-t'>
                <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
                  {report.ip_address && <span>内网: {report.ip_address}</span>}
                  {report.public_ip && <span>公网: {report.public_ip}</span>}
                  {report.network_type && (
                    <span>
                      网络类型: {Array.isArray(report.network_type)
                        ? (report.network_type as NetworkType[]).join(', ')
                        : report.network_type}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className='flex justify-center pt-4'>
          <DataTablePagination
            table={{
              getState: () => ({ pagination: { pageIndex: currentPage - 1, pageSize: 20 } }),
              getPageCount: () => totalPages,
              setPageIndex: (index) => onPageChange(index + 1),
              getCanPreviousPage: () => currentPage > 1,
              getCanNextPage: () => currentPage < totalPages,
              previousPage: () => onPageChange(currentPage - 1),
              nextPage: () => onPageChange(currentPage + 1),
            } as any}
          />
        </div>
      )}

      {/* 详情对话框 */}
      <InstanceReportDetailDialog
        report={selectedReport}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  )
}
