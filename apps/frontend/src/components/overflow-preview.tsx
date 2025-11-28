import { useEffect, useMemo, useRef, useState } from 'react'
import { EyeIcon } from 'lucide-react'
import {
  JsonView,
  allExpanded,
  darkStyles,
  defaultStyles,
} from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
import { cn } from '@/lib/utils'
import { isDarkTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type OverflowPreviewProps = {
  value: unknown
  className?: string
  contentClassName?: string
  title?: string
}

export function OverflowPreview({
  value,
  className,
  contentClassName,
  title,
}: OverflowPreviewProps) {
  const [open, setOpen] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)
  const [overflowed, setOverflowed] = useState(false)

  const { isJson, jsonValue, textValue } = useMemo(() => {
    if (value === null || value === undefined)
      return { isJson: false, jsonValue: undefined, textValue: '' }
    if (typeof value === 'object')
      return {
        isJson: true,
        jsonValue: value as any,
        textValue: JSON.stringify(value),
      }
    const str = String(value)
    try {
      const parsed = JSON.parse(str)
      if (parsed && typeof parsed === 'object')
        return { isJson: true, jsonValue: parsed, textValue: str }
    } catch {}
    return { isJson: false, jsonValue: undefined, textValue: str }
  }, [value])

  useEffect(() => {
    const check = () => {
      const el = textRef.current
      if (!el) return
      setOverflowed(el.scrollWidth > el.clientWidth)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [textValue])

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div ref={textRef} className={cn('w-[150px] truncate', contentClassName)}>
        {textValue || '-'}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        {overflowed && textValue && (
          <DialogTrigger asChild>
            <Button variant='ghost' size='icon' className='shrink-0'>
              <EyeIcon className='size-4' />
            </Button>
          </DialogTrigger>
        )}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title || '详情'}</DialogTitle>
          </DialogHeader>
          {isJson ? (
            <div className='mt-4 max-h-[70vh] max-w-[80vw] overflow-auto'>
              <JsonView
                data={jsonValue as any}
                style={isDarkTheme() ? darkStyles : defaultStyles}
                shouldExpandNode={allExpanded}
              />
            </div>
          ) : (
            <pre className='mt-4 max-h-[70vh] max-w-[80vw] overflow-auto text-sm break-all whitespace-pre-wrap'>
              {textValue}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
