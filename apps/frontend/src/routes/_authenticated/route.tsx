import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthUtils } from '@/lib/auth-utils'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

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
