import { createFileRoute } from '@tanstack/react-router'
import { NetworkTestPage } from '@/features/system/network-test'

export const Route = createFileRoute('/_authenticated/system/network-test')({
  component: NetworkTestPage,
})
