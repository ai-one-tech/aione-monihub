import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

type Input = Date | string | number | null | undefined

function toDate(input: Input): Date | null {
  if (input == null) return null
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input
  const d = new Date(input as any)
  return isNaN(d.getTime()) ? null : d
}

export function formatDateTime(input: Input, pattern = 'yyyy-MM-dd HH:mm:ss'): string {
  const d = toDate(input)
  return d ? format(d, pattern, { locale: zhCN }) : '-'
}

export function formatDate(input: Input, pattern = 'yyyy-MM-dd'): string {
  const d = toDate(input)
  return d ? format(d, pattern, { locale: zhCN }) : '-'
}

export function formatTime(input: Input, pattern = 'HH:mm:ss'): string {
  const d = toDate(input)
  return d ? format(d, pattern, { locale: zhCN }) : '-'
}

export function formatHumanDate(input: Input, pattern = 'd MMM, yyyy'): string {
  const d = toDate(input)
  return d ? format(d, pattern, { locale: zhCN }) : '-'
}

export function formatHumanTime(input: Input, pattern = 'HH:mm'): string {
  const d = toDate(input)
  return d ? format(d, pattern, { locale: zhCN }) : '-'
}

export function toLocalInput(iso?: string): string {
  if (!iso) return ''
  const d = toDate(iso)
  if (!d) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export function fromLocalInputToIso(value?: string): string | undefined {
  if (!value) return undefined
  const d = toDate(value)
  return d ? d.toISOString() : undefined
}

export function toUtcStartOfDayIso(date?: Date): string | undefined {
  if (!date) return undefined
  return format(date, "yyyy-MM-dd'T'00:00:00'Z'", { locale: zhCN })
}

export function toUtcEndOfDayIso(date?: Date): string | undefined {
  if (!date) return undefined
  return format(date, "yyyy-MM-dd'T'23:59:59'Z'", { locale: zhCN })
}