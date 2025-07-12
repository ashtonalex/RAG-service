export async function deleteProject(projectId: string) {
  const res = await fetch(`http://localhost:8000/api/projects/${projectId}`, {
    method: "DELETE",
  });
  return await res.json();
} 