import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { type ProjectResponse } from '../data/api-schema'

interface ProjectsContextType {
  // 项目编辑抽屉状态
  isProjectSheetOpen: boolean
  setIsProjectSheetOpen: (open: boolean) => void
  
  // 项目详情抽屉状态
  isProjectDetailSheetOpen: boolean
  setIsProjectDetailSheetOpen: (open: boolean) => void
  
  // 当前编辑的项目
  editingProject: ProjectResponse | null
  setEditingProject: (project: ProjectResponse | null) => void
  
  // 当前查看详情的项目
  viewingProject: ProjectResponse | null
  setViewingProject: (project: ProjectResponse | null) => void
  
  // 是否为创建模式
  isCreateMode: boolean
  setIsCreateMode: (isCreate: boolean) => void
  
  // 删除确认对话框状态
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  
  // 待删除的项目
  deletingProject: ProjectResponse | null
  setDeletingProject: (project: ProjectResponse | null) => void
  
  // 打开创建项目抽屉
  openCreateProject: () => void
  
  // 打开编辑项目抽屉
  openEditProject: (project: ProjectResponse) => void
  
  // 打开项目详情抽屉
  openProjectDetail: (project: ProjectResponse) => void
  
  // 关闭所有抽屉
  closeAllSheets: () => void
  
  // 打开删除确认对话框
  openDeleteDialog: (project: ProjectResponse) => void
  
  // 关闭删除确认对话框
  closeDeleteDialog: () => void
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [isProjectSheetOpen, setIsProjectSheetOpen] = useState(false)
  const [isProjectDetailSheetOpen, setIsProjectDetailSheetOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null)
  const [viewingProject, setViewingProject] = useState<ProjectResponse | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingProject, setDeletingProject] = useState<ProjectResponse | null>(null)

  const openCreateProject = () => {
    setIsCreateMode(true)
    setEditingProject(null)
    setIsProjectSheetOpen(true)
  }

  const openEditProject = (project: ProjectResponse) => {
    setIsCreateMode(false)
    setEditingProject(project)
    setIsProjectSheetOpen(true)
  }

  const openProjectDetail = (project: ProjectResponse) => {
    setViewingProject(project)
    setIsProjectDetailSheetOpen(true)
  }

  const closeAllSheets = () => {
    setIsProjectSheetOpen(false)
    setIsProjectDetailSheetOpen(false)
    setEditingProject(null)
    setViewingProject(null)
    setIsCreateMode(false)
  }

  const openDeleteDialog = (project: ProjectResponse) => {
    setDeletingProject(project)
    setIsDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setDeletingProject(null)
  }

  const value: ProjectsContextType = {
    isProjectSheetOpen,
    setIsProjectSheetOpen,
    isProjectDetailSheetOpen,
    setIsProjectDetailSheetOpen,
    editingProject,
    setEditingProject,
    viewingProject,
    setViewingProject,
    isCreateMode,
    setIsCreateMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deletingProject,
    setDeletingProject,
    openCreateProject,
    openEditProject,
    openProjectDetail,
    closeAllSheets,
    openDeleteDialog,
    closeDeleteDialog,
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