import React, { createContext, useContext, useState, type ReactNode } from 'react'

type SheetMode = 'create' | 'edit' | 'view'

interface ProjectsContextType {
  // Sheet 状态
  isSheetOpen: boolean
  setIsSheetOpen: (open: boolean) => void
  sheetMode: SheetMode
  setSheetMode: (mode: SheetMode) => void
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
  
  // 删除确认对话框状态
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  deletingProjectId: string | null
  setDeletingProjectId: (id: string | null) => void
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  // Sheet 状态
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<SheetMode>('create')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  
  // 删除确认状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)

  const value: ProjectsContextType = {
    // Sheet 状态
    isSheetOpen,
    setIsSheetOpen,
    sheetMode,
    setSheetMode,
    selectedProjectId,
    setSelectedProjectId,
    
    // 删除确认状态
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deletingProjectId,
    setDeletingProjectId,
  }

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjectsContext() {
  const context = useContext(ProjectsContext)
  if (context === undefined) {
    throw new Error('useProjectsContext must be used within a ProjectsProvider')
  }
  return context
}