"use client"

import { useState, useCallback, type DragEvent, type ChangeEvent } from "react"
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { FILE_TYPES, MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from "@/lib/constants"
import { formatFileSize } from "@/lib/utils"
import type { UploadProgress } from "@/lib/types"

interface FileUploadProps {
  projectId?: string
  onUploadComplete?: (files: File[]) => void
}

export function FileUpload({ projectId, onUploadComplete }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragActive, setIsDragActive] = useState(false)

  const validateFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    return fileArray.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase()
      return extension && SUPPORTED_FILE_TYPES.includes(extension) && file.size <= MAX_FILE_SIZE
    })
  }

  const simulateUpload = async (files: File[]) => {
    const newProgress: UploadProgress[] = files.map((file) => ({
      fileId: `${file.name}-${Date.now()}`,
      fileName: file.name,
      progress: 0,
      status: "uploading",
    }))

    setUploadProgress((prev) => [...prev, ...newProgress])

    // Simulate upload progress
    for (const progressItem of newProgress) {
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        setUploadProgress((prev) =>
          prev.map((item) => (item.fileId === progressItem.fileId ? { ...item, progress } : item)),
        )
      }

      // Mark as processing
      setUploadProgress((prev) =>
        prev.map((item) => (item.fileId === progressItem.fileId ? { ...item, status: "processing" } : item)),
      )

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mark as completed
      setUploadProgress((prev) =>
        prev.map((item) => (item.fileId === progressItem.fileId ? { ...item, status: "completed" } : item)),
      )
    }

    setUploadedFiles((prev) => [...prev, ...files])
    onUploadComplete?.(files)
  }

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    const validFiles = validateFiles(files)

    if (validFiles.length > 0) {
      simulateUpload(validFiles)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const validFiles = validateFiles(files)
      if (validFiles.length > 0) {
        simulateUpload(validFiles)
      }
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ""
  }, [])

  const removeFile = (fileId: string) => {
    setUploadProgress((prev) => prev.filter((item) => item.fileId !== fileId))
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase() as keyof typeof FILE_TYPES
    return FILE_TYPES[extension]?.icon || "📄"
  }

  const getStatusIcon = (status: UploadProgress["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-8">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-red-500 bg-red-500/10" : "border-gray-600 hover:border-gray-500"
            }`}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {isDragActive ? "Drop files here" : "Upload Documents"}
            </h3>
            <p className="text-gray-400 mb-4">Drag and drop your files here, or click to browse</p>
            <p className="text-sm text-gray-500">Supports PDF, DOCX, TXT files up to {formatFileSize(MAX_FILE_SIZE)}</p>
            <label htmlFor="file-upload">
              <Button className="mt-4 bg-red-600 hover:bg-red-700" type="button">
                Choose Files
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">Upload Progress</h3>
            <div className="space-y-4">
              {uploadProgress.map((item) => (
                <div key={item.fileId} className="flex items-center space-x-4">
                  <div className="text-2xl">{getFileIcon(item.fileName)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{item.fileName}</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(item.fileId)}
                          className="h-6 w-6 text-gray-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {item.status === "uploading" && <Progress value={item.progress} className="h-2" />}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400 capitalize">{item.status}</span>
                      {item.status === "uploading" && <span className="text-xs text-gray-400">{item.progress}%</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
