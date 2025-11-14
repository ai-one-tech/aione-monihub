import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { AuthUtils } from '@/lib/auth-utils'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const ok = AuthUtils.checkAndRestoreAuth() && AuthUtils.isAuthenticated()
    if (!ok) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
        replace: true,
      })
    }
  },
  component: AuthenticatedLayout,
})
