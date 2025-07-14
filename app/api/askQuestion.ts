export async function askQuestion(projectId: string, question: string) {
  const res = await fetch("api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, question }),
  });
  if (!res.ok) {
    throw new Error((await res.json()).detail || "Failed to get answer");
  }
  return await res.json();
} 