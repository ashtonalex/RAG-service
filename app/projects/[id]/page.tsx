"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { useQuestions } from "@/hooks/use-questions";
import { useProjectFilesApi } from "@/hooks/useProjectFilesApi";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { projects, loadProjects } = useProjects();
  const { questions, loadQuestions } = useQuestions();
  const {
    files,
    page: filePage,
    pageCount: filePageCount,
    setPage: setFilePage,
    loading: filesLoading,
    search: fileSearch,
    setSearch: setFileSearch,
    status: fileStatus,
    setStatus: setFileStatus,
  } = useProjectFilesApi(projectId);

  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      loadQuestions(projectId);
    }
  }, [projectId]);

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">Files</h2>
        <div className="flex gap-2 mb-2">
          <input
            className="border rounded p-2 text-black"
            placeholder="Search files..."
            value={fileSearch}
            onChange={e => setFileSearch(e.target.value)}
          />
          <select
            className="border rounded p-2 text-black"
            value={fileStatus}
            onChange={e => setFileStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="uploading">Uploading</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        {filesLoading ? (
          <div>Loading files...</div>
        ) : (
          <>
            <ul className="mb-4">
              {files.map((file: any) => (
                <li key={file.fileId} className="mb-2">
                  <div className="p-2 border rounded bg-gray-900 text-white">
                    <div className="font-semibold">{file.filename}</div>
                    <div className="text-xs text-gray-400">Status: {file.status}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                disabled={filePage <= 1}
                onClick={() => setFilePage(filePage - 1)}
              >
                Previous
              </button>
              <span>
                Page {filePage} of {filePageCount}
              </span>
              <button
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                disabled={filePage >= filePageCount}
                onClick={() => setFilePage(filePage + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 