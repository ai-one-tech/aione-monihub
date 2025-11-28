import { SystemPermissionsDeleteDialog } from './system-permissions-delete-dialog'
import { SystemPermissionsEditSheet } from './system-permissions-edit-sheet'

export function SystemPermissionsDialogs() {
  return (
    <>
      <SystemPermissionsEditSheet />
      <SystemPermissionsDeleteDialog />
    </>
  )
}
