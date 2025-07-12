"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuestionInput } from "@/components/question-input"
import { AnswerDisplay } from "@/components/answer-display"
import { useProjects } from "@/hooks/use-projects"
import { useQuestions } from "@/hooks/use-questions"

export default function AskPage() {
  const { projects, currentProject, loadProjects, setCurrentProject } = useProjects()
  const { questions, loading, loadQuestions, askQuestion } = useQuestions()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (currentProject) {
      setSelectedProjectId(currentProject.id)
      loadQuestions(currentProject.id)
    }
  }, [currentProject])

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setCurrentProject(project)
      loadQuestions(projectId)
    }
  }

  const handleAskQuestion = async (question: string) => {
    if (!selectedProjectId) return
    await askQuestion(selectedProjectId, question)
  }

  const handleFeedback = (questionId: string, helpful: boolean) => {
    console.log("Feedback:", questionId, helpful)
    // Here you would typically send feedback to your backend
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Ask Questions</h1>
          <p className="text-gray-400 text-lg">Query your documents using natural language</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Selection */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Select Project</CardTitle>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                    <SelectTrigger className="bg-black border-gray-600 text-white">
                      <SelectValue placeholder="Choose a project to query" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {projects.map((project) => (
                        <SelectItem
                          key={project.id}
                          value={project.id}
                          className="text-white hover:bg-gray-800 focus:bg-gray-800"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{project.name}</span>
                            <span className="text-sm text-gray-400">{project.documentCount} documents</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No projects available</p>
                    <p className="text-gray-500 text-sm">Create a project and upload documents first</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Question Input */}
            {selectedProjectId && (
              <QuestionInput
                onSubmit={handleAskQuestion}
                loading={loading}
                placeholder={`Ask a question about ${currentProject?.name}...`}
              />
            )}

            {/* Answers */}
            <div className="space-y-6">
              {questions.map((question) => (
                <AnswerDisplay key={question.id} question={question} onFeedback={handleFeedback} />
              ))}
            </div>

            {questions.length === 0 && selectedProjectId && !loading && (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">No questions asked yet</p>
                  <p className="text-gray-500 text-sm">Start by asking a question about your documents above</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Questions */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {questions.length > 0 ? (
                  <div className="space-y-3">
                    {questions.slice(0, 5).map((question) => (
                      <div key={question.id} className="p-3 bg-black rounded-lg border border-gray-700">
                        <p className="text-white text-sm line-clamp-2 mb-2">{question.question}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{Math.round(question.confidence * 100)}% confidence</span>
                          <span>{new Date(question.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No recent questions</p>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Tips for Better Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-white text-sm font-medium mb-1">Be Specific</h4>
                  <p className="text-gray-400 text-xs">Ask detailed questions rather than general ones</p>
                </div>
                <div>
                  <h4 className="text-white text-sm font-medium mb-1">Use Keywords</h4>
                  <p className="text-gray-400 text-xs">Include relevant terms from your documents</p>
                </div>
                <div>
                  <h4 className="text-white text-sm font-medium mb-1">Context Matters</h4>
                  <p className="text-gray-400 text-xs">Provide context when asking follow-up questions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
