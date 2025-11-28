import { useState } from 'react'
import { Eye, Cpu, HardDrive, Activity, AppWindowMac } from 'lucide-react'
import { formatDateTime } from '@/lib/datetime'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { type InstanceReportRecord, type NetworkType } from '../data/api-schema'
import { InstanceReportDetailDialog } from './instances-report-detail-dialog'

interface InstanceReportListProps {
  reports: InstanceReportRecord[]
}

export function InstanceReportList({ reports }: InstanceReportListProps) {
  const [selectedReport, setSelectedReport] =
    useState<InstanceReportRecord | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const handleViewDetail = (report: InstanceReportRecord) => {
    setSelectedReport(report)
    setDetailDialogOpen(true)
  }

  const formatPercent = (value: string | undefined) => {
    if (!value) return '- -'
    return parseFloat(value).toFixed(1) + '%'
  }

  if (reports.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <Activity className='text-muted-foreground mb-4 h-12 w-12' />
        <p className='text-muted-foreground text-sm'>暂无上报记录</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {reports.map((report) => (
        <Card
          key={report.id}
          className='hover:bg-accent/50 py-2 transition-colors'
        >
          <CardHeader className='pt-2 pb-2'>
            <div className='flex items-start justify-between'>
              <div>
                <CardTitle className='text-base'>
                  {formatDateTime(report.report_timestamp)}
                </CardTitle>
                <CardDescription className='mt-1'>
                  Agent: {report.agent_type}{' '}
                  {report.agent_version ? `v${report.agent_version}` : ''}
                </CardDescription>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handleViewDetail(report)}
              >
                <Eye className='mr-1 h-4 w-4' />
                详情
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
              {/* CPU 使用率 */}
              <div className='flex items-center gap-2'>
                <Cpu className='h-4 w-4 text-blue-500' />
                <div>
                  <p className='text-muted-foreground text-xs'>CPU</p>
                  <p className='text-sm font-medium'>
                    {formatPercent(report.cpu_usage_percent)}
                  </p>
                </div>
              </div>

              {/* 内存使用率 */}
              <div className='flex items-center gap-2'>
                <HardDrive className='h-4 w-4 text-green-500' />
                <div>
                  <p className='text-muted-foreground text-xs'>内存</p>
                  <p className='text-sm font-medium'>
                    {formatPercent(report.memory_usage_percent)}
                  </p>
                </div>
              </div>

              {/* 磁盘使用率 */}
              <div className='flex items-center gap-2'>
                <HardDrive className='h-4 w-4 text-orange-500' />
                <div>
                  <p className='text-muted-foreground text-xs'>磁盘</p>
                  <p className='text-sm font-medium'>
                    {formatPercent(report.disk_usage_percent)}
                  </p>
                </div>
              </div>

              {/* 操作系统 */}
              <div className='flex items-center gap-2'>
                <AppWindowMac className='h-4 w-4 text-purple-500' />
                <div>
                  <p className='text-muted-foreground text-xs'>系统</p>
                  <p className='text-sm font-medium'>{report.os_type}</p>
                </div>
              </div>
            </div>

            {/* 网络信息 */}
            {(report.ip_address || report.public_ip || report.network_type) && (
              <div className='mt-2 border-t pt-2'>
                <div className='text-muted-foreground flex flex-wrap gap-2 text-xs'>
                  {report.ip_address && <span>内网: {report.ip_address}</span>}
                  {report.public_ip && <span>公网: {report.public_ip}</span>}
                  {report.network_type && (
                    <span>
                      网络类型:{' '}
                      {Array.isArray(report.network_type)
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

      {/* 详情对话框 */}
      <InstanceReportDetailDialog
        report={selectedReport}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  )
}
