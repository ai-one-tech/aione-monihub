import { createContext, useContext, useState, type ReactNode } from 'react'

type UserSheetMode = 'create' | 'edit'

interface SystemUsersContextType {
  isUserSheetOpen: boolean
  setIsUserSheetOpen: (open: boolean) => void
  userSheetMode: UserSheetMode
  setUserSheetMode: (mode: UserSheetMode) => void
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  selectedUserId: string | null
  setSelectedUserId: (id: string | null) => void
}

const SystemUsersContext = createContext<SystemUsersContextType | undefined>(undefined)

export function useSystemUsersContext() {
  const context = useContext(SystemUsersContext)
  if (!context) {
    throw new Error('useSystemUsersContext must be used within SystemUsersProvider')
  }
  return context
}

interface SystemUsersProviderProps {
  children: ReactNode
}

export function SystemUsersProvider({ children }: SystemUsersProviderProps) {
  const [isUserSheetOpen, setIsUserSheetOpen] = useState(false)
  const [userSheetMode, setUserSheetMode] = useState<UserSheetMode>('create')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const value: SystemUsersContextType = {
    isUserSheetOpen,
    setIsUserSheetOpen,
    userSheetMode,
    setUserSheetMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedUserId,
    setSelectedUserId,
  }

  return (
    <SystemUsersContext.Provider value={value}>
      {children}
    </SystemUsersContext.Provider>
  )
}