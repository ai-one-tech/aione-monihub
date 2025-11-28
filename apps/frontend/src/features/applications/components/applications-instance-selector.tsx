import { useState } from 'react'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Instance } from '../data/api-schema'

interface ApplicationInstanceSelectorProps {
  instances: Instance[]
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

export function ApplicationInstanceSelector({
  instances,
  selectedIds,
  onSelectionChange,
}: ApplicationInstanceSelectorProps) {
  const activeInstances = instances.filter(
    (instance) => instance.status === 'active'
  )
  const inactiveInstances = instances.filter(
    (instance) => instance.status !== 'active'
  )

  const handleToggleInstance = (instanceId: string) => {
    if (selectedIds.includes(instanceId)) {
      onSelectionChange(selectedIds.filter((id) => id !== instanceId))
    } else {
      onSelectionChange([...selectedIds, instanceId])
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === activeInstances.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(activeInstances.map((instance) => instance.id))
    }
  }

  const isAllSelected =
    activeInstances.length > 0 && selectedIds.length === activeInstances.length

  return (
    <div className='flex h-full flex-col'>
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-medium'>选择目标实例</h3>
          <Badge variant='secondary'>
            已选 {selectedIds.length} / {activeInstances.length}
          </Badge>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={handleSelectAll}
          disabled={activeInstances.length === 0}
        >
          {isAllSelected ? '取消全选' : '全选'}
        </Button>
      </div>

      {activeInstances.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <AlertCircle className='text-muted-foreground mb-3 h-12 w-12' />
          <p className='text-muted-foreground text-sm'>暂无活跃实例</p>
          <p className='text-muted-foreground mt-1 text-xs'>
            请确保至少有一个实例处于活跃状态
          </p>
        </div>
      ) : (
        <ScrollArea className='-mx-2 flex-1 px-2'>
          <div className='space-y-2'>
            {/* Active Instances */}
            {activeInstances.map((instance) => {
              const isSelected = selectedIds.includes(instance.id)
              return (
                <InstanceCard
                  key={instance.id}
                  instance={instance}
                  isSelected={isSelected}
                  onToggle={() => handleToggleInstance(instance.id)}
                />
              )
            })}

            {/* Inactive Instances - Show as disabled */}
            {inactiveInstances.length > 0 && (
              <>
                <div className='pt-4 pb-2'>
                  <div className='text-muted-foreground text-xs font-medium'>
                    不可用实例
                  </div>
                </div>
                {inactiveInstances.map((instance) => (
                  <InstanceCard
                    key={instance.id}
                    instance={instance}
                    isSelected={false}
                    onToggle={() => {}}
                    disabled
                  />
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

interface InstanceCardProps {
  instance: Instance
  isSelected: boolean
  onToggle: () => void
  disabled?: boolean
}

function InstanceCard({
  instance,
  isSelected,
  onToggle,
  disabled = false,
}: InstanceCardProps) {
  const statusConfig = {
    active: {
      label: '活跃',
      variant: 'success' as const,
      color: 'text-green-600',
    },
    inactive: {
      label: '离线',
      variant: 'secondary' as const,
      color: 'text-gray-600',
    },
    error: {
      label: '异常',
      variant: 'destructive' as const,
      color: 'text-red-600',
    },
  }

  const status = statusConfig[instance.status] || statusConfig.inactive

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-all',
        disabled
          ? 'bg-muted/50 cursor-not-allowed opacity-60'
          : isSelected
            ? 'bg-primary/5 border-primary cursor-pointer shadow-sm'
            : 'hover:bg-accent cursor-pointer'
      )}
      onClick={disabled ? undefined : onToggle}
    >
      <div className='flex h-5 items-center'>
        <Checkbox
          checked={isSelected}
          disabled={disabled}
          onCheckedChange={disabled ? undefined : onToggle}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className='min-w-0 flex-1 space-y-1'>
        <div className='flex items-center gap-2'>
          <h4 className='truncate text-sm font-medium'>{instance.name}</h4>
          <Badge variant={status.variant} className='shrink-0'>
            {status.label}
          </Badge>
        </div>

        <div className='space-y-0.5'>
          <div className='text-muted-foreground flex items-center gap-1 text-xs'>
            <span className='font-mono'>{instance.instance_id}</span>
          </div>
          {instance.ip_address && (
            <div className='text-muted-foreground flex items-center gap-1 text-xs'>
              <span>IP: {instance.ip_address}</span>
            </div>
          )}
          {instance.hostname && (
            <div className='text-muted-foreground flex items-center gap-1 text-xs'>
              <span>主机: {instance.hostname}</span>
            </div>
          )}
          {instance.agent_type && (
            <div className='text-muted-foreground flex items-center gap-1 text-xs'>
              <span>类型: {instance.agent_type}</span>
            </div>
          )}
        </div>
      </div>

      <div className={cn('flex h-5 items-center', status.color)}>
        {isSelected ? (
          <CheckCircle2 className='h-5 w-5' />
        ) : (
          <Circle className='h-5 w-5' />
        )}
      </div>
    </div>
  )
}
