import { createContext, useContext, useState } from 'react'

type SheetMode = 'create' | 'edit' | 'view'

type Ctx = {
  isSheetOpen: boolean
  setIsSheetOpen: (b: boolean) => void
  sheetMode: SheetMode
  setSheetMode: (m: SheetMode) => void
  selectedConfigId?: string
  setSelectedConfigId: (id?: string) => void
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (b: boolean) => void
}

const ConfigsContext = createContext<Ctx | null>(null)

export function ConfigsProvider({ children }: { children: React.ReactNode }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<SheetMode>('create')
  const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>(undefined)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  return (
    <ConfigsContext.Provider value={{ isSheetOpen, setIsSheetOpen, sheetMode, setSheetMode, selectedConfigId, setSelectedConfigId, isDeleteDialogOpen, setIsDeleteDialogOpen }}>
      {children}
    </ConfigsContext.Provider>
  )
}

export function useConfigsProvider() {
  const ctx = useContext(ConfigsContext)
  if (!ctx) throw new Error('ConfigsProvider is missing')
  return ctx
}