"use client"

import type React from "react"

import { useState } from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

interface QuestionInputProps {
  onSubmit: (question: string) => Promise<void>
  loading?: boolean
  placeholder?: string
}

export function QuestionInput({
  onSubmit,
  loading = false,
  placeholder = "Ask a question about your documents...",
}: QuestionInputProps) {
  const [question, setQuestion] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || loading) return

    try {
      await onSubmit(question.trim())
      setQuestion("")
    } catch (error) {
      console.error("Failed to submit question:", error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e)
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[120px] bg-black border-gray-600 text-white placeholder-gray-400 focus:border-red-500 resize-none pr-12"
              disabled={loading}
            />
            <div className="absolute bottom-3 right-3">
              <Button
                type="submit"
                size="icon"
                disabled={!question.trim() || loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Press Cmd/Ctrl + Enter to send</span>
            <span>{question.length}/1000</span>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
