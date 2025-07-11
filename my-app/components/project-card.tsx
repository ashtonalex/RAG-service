"use client"

import Link from "next/link"
import { MoreHorizontal, FileText, Clock, Trash2, Settings } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Project } from "@/lib/types"
import { formatRelativeTime } from "@/lib/utils"
import { useProjects } from "@/hooks/use-projects"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { deleteProject } = useProjects()

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(project.id)
      } catch (error) {
        console.error("Failed to delete project:", error)
      }
    }
  }

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-600"
      case "processing":
        return "bg-yellow-600"
      case "error":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
          <Link href={`/projects/${project.id}`}>
            <h3 className="text-lg font-semibold text-white hover:text-red-400 transition-colors">{project.name}</h3>
          </Link>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{project.description}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-900 border-gray-700" align="end">
            <DropdownMenuItem className="text-white hover:bg-gray-800">
              <Link href={`/projects/${project.id}`} className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={handleDelete} className="text-red-400 hover:bg-gray-800 focus:bg-gray-800">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center">
              <FileText className="mr-1 h-4 w-4" />
              {project.documentCount} docs
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {formatRelativeTime(project.lastActivity)}
            </div>
          </div>
          <Badge variant="secondary" className={`${getStatusColor(project.status)} text-white border-0`}>
            {project.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
