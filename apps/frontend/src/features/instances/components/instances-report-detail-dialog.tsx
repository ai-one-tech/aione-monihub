import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { type InstanceReportRecord, type NetworkType } from '../data/api-schema'

interface InstanceReportDetailDialogProps {
  report: InstanceReportRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InstanceReportDetailDialog({
  report,
  open,
  onOpenChange,
}: InstanceReportDetailDialogProps) {
  if (!report) return null

  const formatPercent = (value: string | undefined) => {
    if (!value) return '- -'
    return parseFloat(value).toFixed(2) + '%'
  }

  const formatBytes = (bytes: number | undefined, unit: 'MB' | 'GB') => {
    if (!bytes) return '- -'
    if (unit === 'GB') {
      return bytes.toFixed(2) + ' GB'
    }
    return bytes.toFixed(2) + ' MB'
  }

  const formatSeconds = (seconds: number | undefined) => {
    if (!seconds) return '- -'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>上报记录详情</DialogTitle>
          <DialogDescription>
            上报时间: {format(new Date(report.report_timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='max-h-[600px] pr-4'>
          <div className='space-y-6'>
            {/* 基础信息 */}
            <div>
              <h3 className='text-sm font-semibold mb-3'>基础信息</h3>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-muted-foreground'>记录ID:</span>
                  <p className='font-mono mt-1'>{report.id}</p>
                </div>
                <div>
                  <span className='text-muted-foreground'>实例ID:</span>
                  <p className='font-mono mt-1'>{report.instance_id}</p>
                </div>
                <div>
                  <span className='text-muted-foreground'>Agent类型:</span>
                  <p className='mt-1'>
                    <Badge>{report.agent_type}</Badge>
                  </p>
                </div>
                <div>
                  <span className='text-muted-foreground'>Agent版本:</span>
                  <p className='mt-1'>{report.agent_version || '- -'}</p>
                </div>
                <div>
                  <span className='text-muted-foreground'>上报时间:</span>
                  <p className='mt-1'>
                    {format(new Date(report.report_timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                  </p>
                </div>
                <div>
                  <span className='text-muted-foreground'>接收时间:</span>
                  <p className='mt-1'>
                    {format(new Date(report.received_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 系统信息 */}
            <div>
              <h3 className='text-sm font-semibold mb-3'>系统信息</h3>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-muted-foreground'>操作系统:</span>
                  <p className='mt-1'>{report.os_type || '- -'}</p>
                </div>
                <div>
                  <span className='text-muted-foreground'>系统版本:</span>
                  <p className='mt-1'>{report.os_version || '- -'}</p>
                </div>
                <div>
                  <span className='text-muted-foreground'>主机名:</span>
                  <p className='mt-1'>{report.hostname || '- -'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 网络信息 */}
            <div>
              <h3 className='text-sm font-semibold mb-3'>网络信息</h3>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-muted-foreground'>内网IP:</span>
                  <p className='mt-1 font-mono'>{report.ip_address || '- -'}</p>
                </div>
                <div>
                  <span className='text-muted-foreground'>公网IP:</span>
                  <p className='mt-1 font-mono'>{report.public_ip || '- -'}</p>
                </div>
                <div>
                  <span className='text-muted-foreground'>MAC地址:</span>
                  <p className='mt-1 font-mono'>{report.mac_address || '- -'}</p>
                </div>
                <div>
                  <span className='text-muted-foreground'>网络类型:</span>
                  <p className='mt-1'>
                    {Array.isArray(report.network_type)
                      ? (report.network_type as NetworkType[]).join(', ')
                      : (report.network_type || '- -')}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 硬件信息 */}
            <div>
              <h3 className='text-sm font-semibold mb-3'>硬件信息</h3>
              <div className='space-y-4'>
                {/* CPU */}
                <div>
                  <h4 className='text-xs font-medium text-muted-foreground mb-2'>CPU</h4>
                  <div className='grid grid-cols-3 gap-4 text-sm'>
                    <div>
                      <span className='text-muted-foreground'>型号:</span>
                      <p className='mt-1'>{report.cpu_model || '- -'}</p>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>核心数:</span>
                      <p className='mt-1'>{report.cpu_cores || '- -'}</p>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>使用率:</span>
                      <p className='mt-1 font-semibold'>{formatPercent(report.cpu_usage_percent)}</p>
                    </div>
                  </div>
                </div>

                {/* 内存 */}
                <div>
                  <h4 className='text-xs font-medium text-muted-foreground mb-2'>内存</h4>
                  <div className='grid grid-cols-3 gap-4 text-sm'>
                    <div>
                      <span className='text-muted-foreground'>总量:</span>
                      <p className='mt-1'>{formatBytes(report.memory_total_mb, 'MB')}</p>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>已用:</span>
                      <p className='mt-1'>{formatBytes(report.memory_used_mb, 'MB')}</p>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>使用率:</span>
                      <p className='mt-1 font-semibold'>{formatPercent(report.memory_usage_percent)}</p>
                    </div>
                  </div>
                </div>

                {/* 磁盘 */}
                <div>
                  <h4 className='text-xs font-medium text-muted-foreground mb-2'>磁盘</h4>
                  <div className='grid grid-cols-3 gap-4 text-sm'>
                    <div>
                      <span className='text-muted-foreground'>总量:</span>
                      <p className='mt-1'>{formatBytes(report.disk_total_gb, 'GB')}</p>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>已用:</span>
                      <p className='mt-1'>{formatBytes(report.disk_used_gb, 'GB')}</p>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>使用率:</span>
                      <p className='mt-1 font-semibold'>{formatPercent(report.disk_usage_percent)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 运行时信息 */}
            <div>
              <h3 className='text-sm font-semibold mb-3'>运行时信息</h3>
              <div className='grid grid-cols-3 gap-4 text-sm'>
                <div>
                  <span className='text-muted-foreground'>进程ID:</span>
                  <p className='mt-1'>{report.process_id || '- -'}</p>
                </div>
                <div>
                  <span className='text-muted-foreground'>运行时长:</span>
                  <p className='mt-1'>{formatSeconds(report.process_uptime_seconds)}</p>
                </div>
                <div>
                  <span className='text-muted-foreground'>线程数:</span>
                  <p className='mt-1'>{report.thread_count || '- -'}</p>
                </div>
              </div>
            </div>

            {/* 自定义指标 */}
            {report.custom_metrics && (
              <>
                <Separator />
                <div>
                  <h3 className='text-sm font-semibold mb-3'>自定义指标</h3>
                  <pre className='text-xs bg-muted p-3 rounded-md overflow-auto'>
                    {JSON.stringify(report.custom_metrics, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
