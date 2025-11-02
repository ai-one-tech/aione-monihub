import React, { createContext, useContext, useState, type ReactNode } from 'react'

type SheetMode = 'create' | 'edit' | 'view'

interface ApplicationsProviderState {
  // Sheet 状态
  isSheetOpen: boolean
  setIsSheetOpen: (open: boolean) => void
  sheetMode: SheetMode
  setSheetMode: (mode: SheetMode) => void
  selectedApplicationId: string | null
  setSelectedApplicationId: (id: string | null) => void
  
  // 删除确认状态
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  deletingApplicationId: string | null
  setDeletingApplicationId: (id: string | null) => void
}

const ApplicationsProviderContext = createContext<ApplicationsProviderState | undefined>(undefined)

interface ApplicationsProviderProps {
  children: ReactNode
}

export function ApplicationsProvider({ children }: ApplicationsProviderProps) {
  // Sheet 状态
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<SheetMode>('create')
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  
  // 删除确认状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingApplicationId, setDeletingApplicationId] = useState<string | null>(null)

  const value: ApplicationsProviderState = {
    // Sheet 状态
    isSheetOpen,
    setIsSheetOpen,
    sheetMode,
    setSheetMode,
    selectedApplicationId,
    setSelectedApplicationId,
    
    // 删除确认状态
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deletingApplicationId,
    setDeletingApplicationId,
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