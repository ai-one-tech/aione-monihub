import React, { createContext, useContext, useState } from 'react'

type DialogMode = 'create' | 'edit'

interface SystemRolesContextType {
  // 对话框状态
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
  dialogMode: DialogMode
  setDialogMode: (mode: DialogMode) => void
  selectedRoleId: string | null
  setSelectedRoleId: (id: string | null) => void
  
  // 删除对话框状态
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  deleteRoleId: string | null
  setDeleteRoleId: (id: string | null) => void
}

const SystemRolesContext = createContext<SystemRolesContextType | undefined>(undefined)

export function useSystemRolesContext() {
  const context = useContext(SystemRolesContext)
  if (!context) {
    throw new Error('useSystemRolesContext must be used within a SystemRolesProvider')
  }
  return context
}

interface SystemRolesProviderProps {
  children: React.ReactNode
}

export function SystemRolesProvider({ children }: SystemRolesProviderProps) {
  // 对话框状态
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>('create')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  
  // 删除对话框状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)

  const value: SystemRolesContextType = {
    // 对话框状态
    isDialogOpen,
    setIsDialogOpen,
    dialogMode,
    setDialogMode,
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