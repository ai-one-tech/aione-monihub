import { SystemRolesCreateDialog } from './system-roles-create-dialog'
import { SystemRolesEditDialog } from './system-roles-edit-dialog'
import { SystemRolesDeleteDialog } from './system-roles-delete-dialog'

export function SystemRolesDialogs() {
  return (
    <>
      <SystemRolesCreateDialog />
      <SystemRolesEditDialog />
      <SystemRolesDeleteDialog />
    </>
  )
}