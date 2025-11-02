import React, { createContext, useContext, useState, type ReactNode } from 'react'

type SheetMode = 'create' | 'edit' | 'view'

interface InstancesProviderState {
  // Sheet 状态
  isSheetOpen: boolean
  setIsSheetOpen: (open: boolean) => void
  sheetMode: SheetMode
  setSheetMode: (mode: SheetMode) => void
  selectedInstanceId: string | null
  setSelectedInstanceId: (id: string | null) => void
  
  // 删除确认状态
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  deletingInstanceId: string | null
  setDeletingInstanceId: (id: string | null) => void
}

const InstancesProviderContext = createContext<InstancesProviderState | undefined>(undefined)

interface InstancesProviderProps {
  children: ReactNode
}

export function InstancesProvider({ children }: InstancesProviderProps) {
  // Sheet 状态
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<SheetMode>('create')
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  
  // 删除确认状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingInstanceId, setDeletingInstanceId] = useState<string | null>(null)

  const value: InstancesProviderState = {
    // Sheet 状态
    isSheetOpen,
    setIsSheetOpen,
    sheetMode,
    setSheetMode,
    selectedInstanceId,
    setSelectedInstanceId,
    
    // 删除确认状态
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deletingInstanceId,
    setDeletingInstanceId,
  }

  return (
    <InstancesProviderContext.Provider value={value}>
      {children}
    </InstancesProviderContext.Provider>
  )
}

export function useInstancesProvider() {
  const context = useContext(InstancesProviderContext)
  if (context === undefined) {
    throw new Error('useInstancesProvider must be used within an InstancesProvider')
  }
  return context
}
