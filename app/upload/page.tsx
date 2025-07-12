"use client";

import React, { useState } from "react";

const CHUNK_STRATEGIES = [
  { value: "fixed_size", label: "Fixed Size" },
  { value: "sentence_boundary", label: "Sentence Boundary" },
  { value: "semantic_similarity", label: "Semantic Similarity" },
  { value: "structural", label: "Structural" },
  { value: "topic_based", label: "Topic Based" },
];

export default function ChunkDemoPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [strategy, setStrategy] = useState("fixed_size");
  const [chunks, setChunks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setChunks([]);
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else if (text.trim()) {
        formData.append("text", text);
      } else {
        setError("Please provide text or upload a file.");
        setLoading(false);
        return;
      }
      formData.append("strategy", strategy);
      const res = await fetch("http://localhost:8000/api/chunk", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Chunking failed");
      }
      const data = await res.json();
      setChunks(data);
    } catch (err: any) {
      setError(err.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">
        Chunking Demo (Python Backend)
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Paste Text</label>
          <textarea
            className="w-full border rounded p-2 min-h-[100px] text-black"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here or upload a file below"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Or Upload File</label>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="text-black"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Chunking Strategy</label>
          <select
            className="border rounded p-2 text-black"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          >
            {CHUNK_STRATEGIES.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-black">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          disabled={loading}
        >
          {loading ? "Chunking..." : "Chunk"}
        </button>
      </form>
      {error && <div className="text-red-600 mt-4">{error}</div>}
      {chunks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Chunks</h2>
          <div className="space-y-4">
            {chunks.map((chunk, idx) => (
              <div
                key={idx}
                className="border rounded p-3 bg-gray-900 text-white"
              >
                <div className="text-xs text-gray-400 mb-1">
                  Chunk {idx + 1} | Tokens: {chunk.metadata.token_count} |
                  Sentences: {chunk.metadata.sentence_count}
                </div>
                <pre className="whitespace-pre-wrap break-words text-sm">
                  {chunk.text}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
