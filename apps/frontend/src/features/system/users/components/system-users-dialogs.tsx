import { SystemUsersCreateDialog } from './system-users-create-dialog'
import { SystemUsersEditDialog } from './system-users-edit-dialog'
import { SystemUsersDeleteDialog } from './system-users-delete-dialog'

export function SystemUsersDialogs() {
  return (
    <>
      <SystemUsersCreateDialog />
      <SystemUsersEditDialog />
      <SystemUsersDeleteDialog />
    </>
  )
}