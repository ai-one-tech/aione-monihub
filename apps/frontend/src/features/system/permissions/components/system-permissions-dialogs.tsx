import { SystemPermissionsEditSheet } from './system-permissions-edit-sheet'
import { SystemPermissionsDeleteDialog } from './system-permissions-delete-dialog'

export function SystemPermissionsDialogs() {
  return (
    <>
      <SystemPermissionsEditSheet />
      <SystemPermissionsDeleteDialog />
    </>
  )
}