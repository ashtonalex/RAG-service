"use client";
import { useState } from "react";
import { useProjectsApi } from "../hooks/useProjectsApi";
import { useAskQuestion } from "../hooks/useAskQuestion";

export default function AskPage() {
  const { projects, loading: projectsLoading } = useProjectsApi();
  const [projectId, setProjectId] = useState("");
  const [question, setQuestion] = useState("");
  const { answer, sources, loading, error, submitQuestion } = useAskQuestion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectId && question.trim()) {
      submitQuestion(projectId, question);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Ask a Question</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Select Project</label>
          <select
            className="border rounded p-2 text-black w-full"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            disabled={projectsLoading}
          >
            <option value="">-- Select a project --</option>
            {projects.map((p: any) => (
              <option key={p.projectId} value={p.projectId}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Your Question</label>
          <input
            className="w-full border rounded p-2 text-black"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Type your question here"
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Getting Answer..." : "Ask"}
        </button>
      </form>
      {error && <div className="text-red-600 mt-4">{error}</div>}
      {answer && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Answer</h2>
          <div className="bg-gray-900 text-white p-4 rounded">{answer}</div>
          <h3 className="text-lg font-semibold mt-4 mb-2">Sources</h3>
          <ul className="text-sm">
            {sources.map((src, idx) => (
              <li key={idx} className="mb-2">
                <pre className="whitespace-pre-wrap break-words bg-gray-800 p-2 rounded">{src.text}</pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 