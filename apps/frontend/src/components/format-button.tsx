import React from 'react'
import { Button } from '@/components/ui/button'

interface FormatButtonProps {
  onClick: () => void
  className?: string
}

export function FormatButton({ onClick, className }: FormatButtonProps) {
  return (
    <Button
      variant='outline'
      size='sm'
      onClick={onClick}
      className={className || 'text-xs'}
    >
      格式化
    </Button>
  )
}
