"use client"

import { useApp } from "@/lib/app-context"
import type { Project } from "@/lib/types"

// Mock data for development
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Company Knowledge Base",
    description: "Internal documentation and policies",
    documentCount: 45,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    status: "active",
  },
  {
    id: "2",
    name: "Product Documentation",
    description: "User manuals and technical specifications",
    documentCount: 23,
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    status: "active",
  },
  {
    id: "3",
    name: "Research Papers",
    description: "Academic research and whitepapers",
    documentCount: 12,
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    status: "processing",
  },
]

export function useProjects() {
  const { state, dispatch } = useApp()

  const loadProjects = async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      dispatch({ type: "SET_PROJECTS", payload: mockProjects })
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to load projects" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const createProject = async (name: string, description: string) => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const newProject: Project = {
        id: Date.now().toString(),
        name,
        description,
        documentCount: 0,
        lastActivity: new Date(),
        createdAt: new Date(),
        status: "active",
      }
      dispatch({ type: "ADD_PROJECT", payload: newProject })
      return newProject
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to create project" })
      throw error
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const deleteProject = async (projectId: string) => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      dispatch({ type: "DELETE_PROJECT", payload: projectId })
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to delete project" })
      throw error
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const setCurrentProject = (project: Project | null) => {
    dispatch({ type: "SET_CURRENT_PROJECT", payload: project })
  }

  return {
    projects: state.projects,
    currentProject: state.currentProject,
    loading: state.loading,
    error: state.error,
    loadProjects,
    createProject,
    deleteProject,
    setCurrentProject,
  }
}
