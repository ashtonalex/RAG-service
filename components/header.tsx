"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Bell, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProjects } from "@/hooks/use-projects"

export function Header() {
  const pathname = usePathname()
  const { currentProject, projects, setCurrentProject } = useProjects()

  const navigation = [
    { name: "Dashboard", href: "/", current: pathname === "/" },
    { name: "Projects", href: "/projects", current: pathname === "/projects" },
    { name: "Upload", href: "/upload", current: pathname === "/upload" },
    { name: "Ask", href: "/ask", current: pathname === "/ask" },
  ]

  return (
    <header className="bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-white font-semibold text-xl">QA-RAG</span>
            </Link>

            <nav className="hidden md:flex space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    item.current ? "text-red-500 border-b-2 border-red-500" : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Project Selector and Actions */}
          <div className="flex items-center space-x-4">
            {/* Project Selector */}
            {projects.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
                    {currentProject?.name || "Select Project"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-gray-900 border-gray-700">
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => setCurrentProject(project)}
                      className="text-white hover:bg-gray-800 focus:bg-gray-800"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-sm text-gray-400">{project.documentCount} documents</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem className="text-white hover:bg-gray-800 focus:bg-gray-800">
                    <Link href="/projects">Manage Projects</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 w-64 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-red-500"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gray-800">
              <Bell className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gray-800">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-gray-900 border-gray-700" align="end">
                <DropdownMenuItem className="text-white hover:bg-gray-800 focus:bg-gray-800">Profile</DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-gray-800 focus:bg-gray-800">Settings</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem className="text-white hover:bg-gray-800 focus:bg-gray-800">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
