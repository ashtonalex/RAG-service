"use client";
import { useProjectsApi } from "../hooks/useProjectsApi";

export default function ProjectsPage() {
  const { projects, page, pageCount, setPage, loading, search, setSearch } = useProjectsApi();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      <input
        className="border rounded p-2 mb-4 text-black"
        placeholder="Search projects..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <ul className="mb-4">
            {projects.map((project: any) => (
              <li key={project.projectId} className="mb-2">
                <div className="p-2 border rounded bg-gray-900 text-white">
                  <div className="font-semibold">{project.name}</div>
                  <div className="text-xs text-gray-400">{project.description}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {pageCount}
            </span>
            <button
              className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
} 