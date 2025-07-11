"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, FileText, MessageSquare, Settings, Upload, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useProjects } from "@/hooks/use-projects"
import { useQuestions } from "@/hooks/use-questions"
import { formatDate, formatRelativeTime } from "@/lib/utils"

// Mock documents data
const mockDocuments = [
  {
    id: "1",
    name: "Employee Handbook.pdf",
    type: "pdf" as const,
    size: 2048576,
    status: "completed" as const,
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30000),
  },
  {
    id: "2",
    name: "Finance Procedures.pdf",
    type: "pdf" as const,
    size: 1536000,
    status: "completed" as const,
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45000),
  },
  {
    id: "3",
    name: "Company Policies.docx",
    type: "docx" as const,
    size: 892000,
    status: "processing" as const,
    uploadedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const { projects, loadProjects } = useProjects()
  const { questions, loadQuestions } = useQuestions()
  const [documents] = useState(mockDocuments)

  const project = projects.find((p) => p.id === projectId)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (projectId) {
      loadQuestions(projectId)
    }
  }, [projectId])

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Project not found</p>
          <Link href="/projects">
            <Button className="bg-red-600 hover:bg-red-700">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600"
      case "processing":
        return "bg-yellow-600"
      case "failed":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "📄"
      case "docx":
        return "📝"
      case "txt":
        return "📋"
      default:
        return "📄"
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            <p className="text-gray-400">{project.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/upload">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </Link>
            <Link href="/ask">
              <Button className="bg-green-600 hover:bg-green-700">
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask Questions
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Documents</p>
                  <p className="text-2xl font-bold text-white">{documents.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Questions</p>
                  <p className="text-2xl font-bold text-white">{questions.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Last Activity</p>
                  <p className="text-lg font-semibold text-white">{formatRelativeTime(project.lastActivity)}</p>
                </div>
                <Settings className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-700">
            <TabsTrigger value="documents" className="data-[state=active]:bg-red-600">
              Documents
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-red-600">
              Q&A History
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-red-600">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-black rounded-lg border border-gray-700"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">{getFileIcon(doc.type)}</div>
                          <div>
                            <h4 className="text-white font-medium">{doc.name}</h4>
                            <p className="text-gray-400 text-sm">
                              Uploaded {formatDate(doc.uploadedAt)}
                              {doc.processedAt && ` • Processed ${formatRelativeTime(doc.processedAt)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className={`${getStatusColor(doc.status)} text-white border-0`}>
                            {doc.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No documents uploaded yet</p>
                    <Link href="/upload">
                      <Button className="bg-red-600 hover:bg-red-700">Upload Documents</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Question & Answer History</CardTitle>
              </CardHeader>
              <CardContent>
                {questions.length > 0 ? (
                  <div className="space-y-6">
                    {questions.map((question) => (
                      <div key={question.id} className="p-4 bg-black rounded-lg border border-gray-700">
                        <div className="mb-3">
                          <h4 className="text-white font-medium mb-1">{question.question}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{formatDate(question.timestamp)}</span>
                            <Badge variant="secondary" className="bg-blue-600 text-white border-0">
                              {Math.round(question.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-3">{question.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No questions asked yet</p>
                    <Link href="/ask">
                      <Button className="bg-red-600 hover:bg-red-700">Ask a Question</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Project Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-white font-medium mb-2">Project Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">{formatDate(project.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Activity:</span>
                      <span className="text-white">{formatDate(project.lastActivity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <Badge variant="secondary" className={`${getStatusColor(project.status)} text-white border-0`}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-700">
                  <h4 className="text-white font-medium mb-4">Danger Zone</h4>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
