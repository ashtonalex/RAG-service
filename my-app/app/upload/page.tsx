"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/file-upload"
import { useProjects } from "@/hooks/use-projects"

export default function UploadPage() {
  const { projects, currentProject, loadProjects, setCurrentProject } = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (currentProject) {
      setSelectedProjectId(currentProject.id)
    }
  }, [currentProject])

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setCurrentProject(project)
    }
  }

  const handleUploadComplete = (files: File[]) => {
    console.log("Upload completed:", files)
    // Here you would typically update the project's document count
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload Documents</h1>
          <p className="text-gray-400 text-lg">Add documents to your knowledge base for question answering</p>
        </div>

        {/* Project Selection */}
        <Card className="bg-gray-900 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Select Project</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                <SelectTrigger className="bg-black border-gray-600 text-white">
                  <SelectValue placeholder="Choose a project to upload to" />
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
                <Button className="bg-red-600 hover:bg-red-700">Create a Project First</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Upload */}
        {selectedProjectId && <FileUpload projectId={selectedProjectId} onUploadComplete={handleUploadComplete} />}

        {/* Upload Guidelines */}
        <Card className="bg-gray-900 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Upload Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">Supported File Types</h4>
              <ul className="text-gray-400 space-y-1">
                <li>• PDF documents (.pdf)</li>
                <li>• Word documents (.docx)</li>
                <li>• Text files (.txt)</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">File Size Limits</h4>
              <p className="text-gray-400">Maximum file size: 10MB per file</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Processing Time</h4>
              <p className="text-gray-400">
                Documents are processed automatically after upload. Processing time varies based on file size and
                content complexity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
