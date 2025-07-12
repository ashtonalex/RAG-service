"use client"

import type React from "react"
import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { Project, Question, Document } from "@/lib/types"

interface AppState {
  currentProject: Project | null
  projects: Project[]
  questions: Question[]
  documents: Document[]
  loading: boolean
  error: string | null
}

type AppAction =
  | { type: "SET_CURRENT_PROJECT"; payload: Project | null }
  | { type: "SET_PROJECTS"; payload: Project[] }
  | { type: "ADD_PROJECT"; payload: Project }
  | { type: "UPDATE_PROJECT"; payload: Project }
  | { type: "DELETE_PROJECT"; payload: string }
  | { type: "SET_QUESTIONS"; payload: Question[] }
  | { type: "ADD_QUESTION"; payload: Question }
  | { type: "SET_DOCUMENTS"; payload: Document[] }
  | { type: "ADD_DOCUMENT"; payload: Document }
  | { type: "UPDATE_DOCUMENT"; payload: Document }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }

const initialState: AppState = {
  currentProject: null,
  projects: [],
  questions: [],
  documents: [],
  loading: false,
  error: null,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CURRENT_PROJECT":
      return { ...state, currentProject: action.payload }
    case "SET_PROJECTS":
      return { ...state, projects: action.payload }
    case "ADD_PROJECT":
      return { ...state, projects: [...state.projects, action.payload] }
    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.payload.id ? action.payload : p)),
        currentProject: state.currentProject?.id === action.payload.id ? action.payload : state.currentProject,
      }
    case "DELETE_PROJECT":
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject,
      }
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload }
    case "ADD_QUESTION":
      return { ...state, questions: [action.payload, ...state.questions] }
    case "SET_DOCUMENTS":
      return { ...state, documents: action.payload }
    case "ADD_DOCUMENT":
      return { ...state, documents: [...state.documents, action.payload] }
    case "UPDATE_DOCUMENT":
      return {
        ...state,
        documents: state.documents.map((d) => (d.id === action.payload.id ? action.payload : d)),
      }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
