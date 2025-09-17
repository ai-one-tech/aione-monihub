import { createContext, useContext, useState, type ReactNode } from 'react'

interface SystemUsersContextType {
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const value: SystemUsersContextType = {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
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