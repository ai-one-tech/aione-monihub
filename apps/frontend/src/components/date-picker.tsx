'use client'

import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'

type DatePickerProps = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
}

export function DatePicker({
  selected,
  onSelect,
  placeholder = 'Pick a date',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        data-empty={!selected}
        className={cn(
          'w-[240px] justify-start text-left font-normal',
          !selected && 'text-muted-foreground'
        )}
        type="button"
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          format(selected, 'MMM d, yyyy')
        ) : (
          <span>{placeholder}</span>
        )}
        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
      </Button>
      
      {open && (
        <div 
          className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg p-0"
          style={{ zIndex: 9999 }}
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              onSelect(date)
              setOpen(false)
            }}
            disabled={(date: Date) =>
              date > new Date() || date < new Date('1900-01-01')
            }
            initialFocus
            className="p-3"
          />
        </div>
      )}
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
