"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, Copy, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Question } from "@/lib/types"
import { formatDate } from "@/lib/utils"

interface AnswerDisplayProps {
  question: Question
  onFeedback?: (questionId: string, helpful: boolean) => void
}

export function AnswerDisplay({ question, onFeedback }: AnswerDisplayProps) {
  const [feedback, setFeedback] = useState<boolean | null>(question.helpful ?? null)

  const handleFeedback = (helpful: boolean) => {
    setFeedback(helpful)
    onFeedback?.(question.id, helpful)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(question.answer)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-600"
    if (confidence >= 0.6) return "bg-yellow-600"
    return "bg-red-600"
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white mb-2">{question.question}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>{formatDate(question.timestamp)}</span>
              <Badge variant="secondary" className={`${getConfidenceColor(question.confidence)} text-white border-0`}>
                {Math.round(question.confidence * 100)}% confidence
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={copyToClipboard} className="text-gray-400 hover:text-white">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Answer */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Answer</h4>
          <div className="prose prose-invert max-w-none">
            <p className="text-white leading-relaxed">{question.answer}</p>
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Sources */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Sources</h4>
          <div className="space-y-3">
            {question.sources.map((source, index) => (
              <div key={index} className="bg-black rounded-lg p-4 border border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-white">{source.documentName}</span>
                    {source.pageNumber && (
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                        Page {source.pageNumber}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                    {Math.round(source.relevanceScore * 100)}% match
                  </Badge>
                </div>
                <p className="text-sm text-gray-300 italic">"{source.excerpt}"</p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Feedback */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Was this answer helpful?</span>
          <div className="flex items-center space-x-2">
            <Button
              variant={feedback === true ? "default" : "ghost"}
              size="sm"
              onClick={() => handleFeedback(true)}
              className={feedback === true ? "bg-green-600 hover:bg-green-700" : "text-gray-400 hover:text-white"}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Yes
            </Button>
            <Button
              variant={feedback === false ? "default" : "ghost"}
              size="sm"
              onClick={() => handleFeedback(false)}
              className={feedback === false ? "bg-red-600 hover:bg-red-700" : "text-gray-400 hover:text-white"}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              No
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
