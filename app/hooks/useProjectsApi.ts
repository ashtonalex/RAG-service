import { useEffect, useState } from "react";

export function useProjectsApi(limit = 20) {
  const [projects, setProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");

  const loadProjects = async (newOffset = offset, newSearch = search) => {
    setLoading(true);
    const res = await fetch(
      `http://localhost:8000/api/projects?limit=${limit}&offset=${newOffset}&search=${encodeURIComponent(newSearch)}`
    );
    const data = await res.json();
    setProjects(data.projects || []);
    setTotal(data.total || 0);
    setLoading(false);
    setOffset(newOffset);
  };

  useEffect(() => {
    loadProjects(0, search);
    // eslint-disable-next-line
  }, [search]);

  return {
    projects,
    total,
    loading,
    offset,
    page: Math.floor(offset / limit) + 1,
    pageCount: Math.ceil(total / limit),
    setPage: (page: number) => loadProjects((page - 1) * limit, search),
    reload: () => loadProjects(offset, search),
    search,
    setSearch,
  };
} 