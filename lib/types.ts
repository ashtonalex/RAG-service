export interface Project {
  id: string
  name: string
  description: string
  documentCount: number
  lastActivity: Date
  createdAt: Date
  status: "active" | "processing" | "error"
}

export interface Document {
  id: string
  projectId: string
  name: string
  type: "pdf" | "docx" | "txt"
  size: number
  status: "uploading" | "processing" | "completed" | "failed"
  uploadedAt: Date
  processedAt?: Date
}

export interface Question {
  id: string
  projectId: string
  question: string
  answer: string
  sources: Source[]
  confidence: number
  timestamp: Date
  helpful?: boolean
}

export interface Source {
  documentId: string
  documentName: string
  pageNumber?: number
  excerpt: string
  relevanceScore: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: "uploading" | "processing" | "completed" | "failed"
}
