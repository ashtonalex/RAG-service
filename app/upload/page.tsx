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
  const [files, setFiles] = useState<File[]>([]);
  const [strategy, setStrategy] = useState("fixed_size");
  const [results, setResults] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    setErrors([]);
    try {
      if (!projectId.trim()) {
        setError("Please provide a Project ID.");
        setLoading(false);
        return;
      }
      if (files.length === 0) {
        setError("Please select at least one file.");
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("projectId", projectId);
      files.forEach((file) => formData.append("files", file));
      formData.append("strategy", strategy);
      const res = await fetch("http://localhost:8000/api/batch-upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Batch upload failed");
      }
      const data = await res.json();
      setResults(data.results || []);
      setErrors(data.errors || []);
    } catch (err: any) {
      setError(err.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">
        Multi-file Chunking Demo (Python Backend)
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Project ID</label>
          <input
            className="w-full border rounded p-2 text-black"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Enter project ID"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Select Files</label>
          <input
            type="file"
            accept=".txt"
            multiple
            onChange={handleFileChange}
            className="text-black"
          />
          {files.length > 0 && (
            <ul className="mt-2 text-sm text-gray-300">
              {files.map((file, idx) => (
                <li key={idx}>{file.name}</li>
              ))}
            </ul>
          )}
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
          {loading ? "Uploading & Chunking..." : "Batch Upload & Chunk"}
        </button>
      </form>
      {error && <div className="text-red-600 mt-4">{error}</div>}
      {errors.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2 text-red-400">Errors</h2>
          <ul className="text-sm">
            {errors.map((err, idx) => (
              <li key={idx} className="mb-1">{err.filename}: {err.error}</li>
            ))}
          </ul>
        </div>
      )}
      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Chunking Results</h2>
          {results.map((result, idx) => (
            <div key={idx} className="mb-6 border rounded p-3 bg-gray-900 text-white">
              <div className="text-xs text-gray-400 mb-1">
                File: {result.filename} | Chunks: {result.chunks.length}
              </div>
              {result.chunks.map((chunk: any, cidx: number) => (
                <div key={cidx} className="mb-2">
                  <div className="text-xs text-gray-400">
                    Chunk {cidx + 1} | Tokens: {chunk.metadata.token_count} | Sentences: {chunk.metadata.sentence_count}
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-sm">
                    {chunk.text}
                  </pre>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 