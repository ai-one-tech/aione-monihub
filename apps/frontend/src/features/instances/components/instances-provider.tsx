import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { type InstanceResponse } from '../data/api-schema'

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
  
  // 启用/禁用确认状态
  isEnableDisableDialogOpen: boolean
  setIsEnableDisableDialogOpen: (open: boolean) => void
  enableDisableInstanceId: string | null
  setEnableDisableInstanceId: (id: string | null) => void
  enableDisableAction: 'enable' | 'disable' | null
  setEnableDisableAction: (action: 'enable' | 'disable' | null) => void
  
  // 上报记录抽屉状态
  reportDrawerOpen: boolean
  setReportDrawerOpen: (open: boolean) => void
  reportInstance: InstanceResponse | null
  setReportInstance: (instance: InstanceResponse | null) => void
  // 配置抽屉状态
  configDrawerOpen: boolean
  setConfigDrawerOpen: (open: boolean) => void
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
  
  // 启用/禁用确认状态
  const [isEnableDisableDialogOpen, setIsEnableDisableDialogOpen] = useState(false)
  const [enableDisableInstanceId, setEnableDisableInstanceId] = useState<string | null>(null)
  const [enableDisableAction, setEnableDisableAction] = useState<'enable' | 'disable' | null>(null)
  
  // 上报记录抽屉状态
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false)
  const [reportInstance, setReportInstance] = useState<InstanceResponse | null>(null)
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false)

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
    
    // 启用/禁用确认状态
    isEnableDisableDialogOpen,
    setIsEnableDisableDialogOpen,
    enableDisableInstanceId,
    setEnableDisableInstanceId,
    enableDisableAction,
    setEnableDisableAction,
    
    // 上报记录抽屉状态
    reportDrawerOpen,
    setReportDrawerOpen,
    reportInstance,
    setReportInstance,
    configDrawerOpen,
    setConfigDrawerOpen,
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
