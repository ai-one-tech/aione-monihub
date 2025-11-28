import React, { createContext, useContext, useState } from 'react'

type SheetMode = 'create' | 'edit' | 'view'

interface SystemRolesContextType {
  // Sheet状态（创建、编辑和查看）
  isSheetOpen: boolean
  setIsSheetOpen: (open: boolean) => void
  sheetMode: SheetMode
  setSheetMode: (mode: SheetMode) => void
  selectedRoleId: string | null
  setSelectedRoleId: (id: string | null) => void

  // 删除对话框状态
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  deleteRoleId: string | null
  setDeleteRoleId: (id: string | null) => void
}

const SystemRolesContext = createContext<SystemRolesContextType | undefined>(
  undefined
)

export function useSystemRolesContext() {
  const context = useContext(SystemRolesContext)
  if (!context) {
    throw new Error(
      'useSystemRolesContext must be used within a SystemRolesProvider'
    )
  }
  return context
}

interface SystemRolesProviderProps {
  children: React.ReactNode
}

export function SystemRolesProvider({ children }: SystemRolesProviderProps) {
  // Sheet状态（创建、编辑和查看）
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<SheetMode>('create')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  // 删除对话框状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)

  const value: SystemRolesContextType = {
    // Sheet状态
    isSheetOpen,
    setIsSheetOpen,
    sheetMode,
    setSheetMode,
    selectedRoleId,
    setSelectedRoleId,

    // 删除对话框状态
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteRoleId,
    setDeleteRoleId,
  }

  return (
    <SystemRolesContext.Provider value={value}>
      {children}
    </SystemRolesContext.Provider>
  )
}
