import { useEffect, useState } from "react";

export function useProjectFilesApi(projectId: string, limit = 20) {
  const [files, setFiles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const loadFiles = async (newOffset = offset, newSearch = search, newStatus = status) => {
    setLoading(true);
    const res = await fetch(
      `http://localhost:8000/api/projects/${projectId}/files?limit=${limit}&offset=${newOffset}&search=${encodeURIComponent(newSearch)}&status=${encodeURIComponent(newStatus)}`
    );
    const data = await res.json();
    setFiles(data.files || []);
    setTotal(data.total || 0);
    setLoading(false);
    setOffset(newOffset);
  };

  useEffect(() => {
    if (projectId) loadFiles(0, search, status);
    // eslint-disable-next-line
  }, [projectId, search, status]);

  return {
    files,
    total,
    loading,
    offset,
    page: Math.floor(offset / limit) + 1,
    pageCount: Math.ceil(total / limit),
    setPage: (page: number) => loadFiles((page - 1) * limit, search, status),
    reload: () => loadFiles(offset, search, status),
    search,
    setSearch,
    status,
    setStatus,
  };
} 