import React, { createContext, useContext, useState } from 'react'
import { type ApiRoleResponse } from '../data/api-schema'

interface SystemRolesContextType {
  // 创建角色对话框
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
  
  // 编辑角色对话框
  editingRole: ApiRoleResponse | null
  setEditingRole: (role: ApiRoleResponse | null) => void
  
  // 删除角色对话框
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<ApiRoleResponse | null>(null)
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)

  const value: SystemRolesContextType = {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    editingRole,
    setEditingRole,
    deleteRoleId,
    setDeleteRoleId,
  }

  return (
    <SystemRolesContext.Provider value={value}>
      {children}
    </SystemRolesContext.Provider>
  )
}