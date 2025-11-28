import { createContext, useContext, useState, type ReactNode } from 'react'

type PermissionSheetMode = 'create' | 'edit' | 'view'

interface SystemPermissionsContextType {
  isPermissionSheetOpen: boolean
  setIsPermissionSheetOpen: (open: boolean) => void
  permissionSheetMode: PermissionSheetMode
  setPermissionSheetMode: (mode: PermissionSheetMode) => void
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  selectedPermissionId: string | null
  setSelectedPermissionId: (id: string | null) => void
}

const SystemPermissionsContext = createContext<
  SystemPermissionsContextType | undefined
>(undefined)

export function useSystemPermissions() {
  const context = useContext(SystemPermissionsContext)
  if (context === undefined) {
    throw new Error(
      'useSystemPermissions must be used within a SystemPermissionsProvider'
    )
  }
  return context
}

interface SystemPermissionsProviderProps {
  children: ReactNode
}

export function SystemPermissionsProvider({
  children,
}: SystemPermissionsProviderProps) {
  const [isPermissionSheetOpen, setIsPermissionSheetOpen] = useState(false)
  const [permissionSheetMode, setPermissionSheetMode] =
    useState<PermissionSheetMode>('create')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPermissionId, setSelectedPermissionId] = useState<
    string | null
  >(null)

  const value: SystemPermissionsContextType = {
    isPermissionSheetOpen,
    setIsPermissionSheetOpen,
    permissionSheetMode,
    setPermissionSheetMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedPermissionId,
    setSelectedPermissionId,
  }

  return (
    <SystemPermissionsContext.Provider value={value}>
      {children}
    </SystemPermissionsContext.Provider>
  )
}
