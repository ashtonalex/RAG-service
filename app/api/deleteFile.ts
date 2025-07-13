export async function deleteFile(fileId: string) {
  const res = await fetch(`http://localhost:8000/api/files/${fileId}`, {
    method: "DELETE",
  });
  return await res.json();
} 