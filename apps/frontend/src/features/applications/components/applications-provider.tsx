import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { type ApplicationResponse } from '../data/api-schema'

interface ApplicationsProviderState {
  // 编辑状态
  isEditSheetOpen: boolean
  setIsEditSheetOpen: (open: boolean) => void
  editingApplication: ApplicationResponse | null
  setEditingApplication: (application: ApplicationResponse | null) => void
  
  // 删除确认状态
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  deletingApplication: ApplicationResponse | null
  setDeletingApplication: (application: ApplicationResponse | null) => void
  
  // 创建状态
  isCreateSheetOpen: boolean
  setIsCreateSheetOpen: (open: boolean) => void
  
  // 查看详情状态
  isViewDialogOpen: boolean
  setIsViewDialogOpen: (open: boolean) => void
  viewingApplication: ApplicationResponse | null
  setViewingApplication: (application: ApplicationResponse | null) => void
}

const ApplicationsProviderContext = createContext<ApplicationsProviderState | undefined>(undefined)

interface ApplicationsProviderProps {
  children: ReactNode
}

export function ApplicationsProvider({ children }: ApplicationsProviderProps) {
  // 编辑状态
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<ApplicationResponse | null>(null)
  
  // 删除确认状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingApplication, setDeletingApplication] = useState<ApplicationResponse | null>(null)
  
  // 创建状态
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  
  // 查看详情状态
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingApplication, setViewingApplication] = useState<ApplicationResponse | null>(null)

  const value: ApplicationsProviderState = {
    // 编辑状态
    isEditSheetOpen,
    setIsEditSheetOpen,
    editingApplication,
    setEditingApplication,
    
    // 删除确认状态
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deletingApplication,
    setDeletingApplication,
    
    // 创建状态
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    
    // 查看详情状态
    isViewDialogOpen,
    setIsViewDialogOpen,
    viewingApplication,
    setViewingApplication,
  }

  return (
    <ApplicationsProviderContext.Provider value={value}>
      {children}
    </ApplicationsProviderContext.Provider>
  )
}

export function useApplicationsProvider() {
  const context = useContext(ApplicationsProviderContext)
  if (context === undefined) {
    throw new Error('useApplicationsProvider must be used within an ApplicationsProvider')
  }
  return context
}