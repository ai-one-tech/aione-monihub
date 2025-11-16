const API_URL = (import.meta as any).env?.VITE_API_URL as string | undefined
const DEFAULT_PAGE_SIZE_RAW = (import.meta as any).env?.VITE_DEFAULT_PAGE_SIZE as string | undefined

const parsePositiveInt = (v?: string, fallback = 20): number => {
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const env = {
  API_URL: API_URL?.trim() || '',
  DEFAULT_PAGE_SIZE: parsePositiveInt(DEFAULT_PAGE_SIZE_RAW, 20),
}