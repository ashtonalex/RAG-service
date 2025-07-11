"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Plus, Upload, MessageSquare, FolderOpen, TrendingUp, Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProjects } from "@/hooks/use-projects"
import { useQuestions } from "@/hooks/use-questions"
import { formatRelativeTime } from "@/lib/utils"

export default function Dashboard() {
  const { projects, loadProjects, loading } = useProjects()
  const { questions } = useQuestions()

  useEffect(() => {
    loadProjects()
  }, [])

  const totalDocuments = projects.reduce((sum, project) => sum + project.documentCount, 0)
  const recentQuestions = questions.slice(0, 5)

  const stats = [
    {
      title: "Total Projects",
      value: projects.length,
      icon: FolderOpen,
      color: "text-blue-400",
    },
    {
      title: "Total Documents",
      value: totalDocuments,
      icon: FileText,
      color: "text-green-400",
    },
    {
      title: "Questions Asked",
      value: questions.length,
      icon: MessageSquare,
      color: "text-purple-400",
    },
    {
      title: "Active Projects",
      value: projects.filter((p) => p.status === "active").length,
      icon: TrendingUp,
      color: "text-red-400",
    },
  ]

  const quickActions = [
    {
      title: "Upload Documents",
      description: "Add new documents to your projects",
      href: "/upload",
      icon: Upload,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Ask Question",
      description: "Query your document database",
      href: "/ask",
      icon: MessageSquare,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Create Project",
      description: "Start a new document collection",
      href: "/projects",
      icon: Plus,
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to QA-RAG</h1>
          <p className="text-gray-400 text-lg">Your intelligent document question-answering system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-gray-900 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href}>
                    <div
                      className={`${action.color} rounded-lg p-6 text-center hover:scale-105 transition-transform cursor-pointer`}
                    >
                      <action.icon className="h-8 w-8 text-white mx-auto mb-3" />
                      <h3 className="text-white font-semibold mb-2">{action.title}</h3>
                      <p className="text-white/80 text-sm">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Recent Projects */}
            <Card className="bg-gray-900 border-gray-700 mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Recent Projects</CardTitle>
                <Link href="/projects">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:text-white bg-transparent"
                  >
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="flex items-center justify-between p-4 bg-black rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                          <div>
                            <h4 className="text-white font-medium">{project.name}</h4>
                            <p className="text-gray-400 text-sm">{project.documentCount} documents</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-sm">{formatRelativeTime(project.lastActivity)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No projects yet</p>
                    <Link href="/projects">
                      <Button className="bg-red-600 hover:bg-red-700">Create Your First Project</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentQuestions.length > 0 ? (
                  <div className="space-y-4">
                    {recentQuestions.map((question) => (
                      <div key={question.id} className="border-l-2 border-red-500 pl-4">
                        <p className="text-white text-sm font-medium line-clamp-2">{question.question}</p>
                        <p className="text-gray-400 text-xs mt-1">{formatRelativeTime(question.timestamp)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No recent questions</p>
                    <Link href="/ask">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        Ask a Question
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
