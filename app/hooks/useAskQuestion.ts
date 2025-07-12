import { useState } from "react";
import { askQuestion } from "../api/askQuestion";

export function useAskQuestion() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuestion = async (projectId: string, question: string) => {
    setLoading(true);
    setError(null);
    setAnswer(null);
    setSources([]);
    try {
      const data = await askQuestion(projectId, question);
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err: any) {
      setError(err.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { answer, sources, loading, error, submitQuestion };
} 