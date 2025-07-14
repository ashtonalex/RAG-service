import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCache, setCache } from '@/lib/cache'; // ✅ This line is missing

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });


export async function decomposeQuestion(question: string): Promise<string[]> {
  const cacheKey = `decomp:${question}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log('✅ Decomposition cache hit');
    return JSON.parse(cached);
  }

  const prompt = `
You are an assistant that helps break down complex questions.

Task:
Break down the following question into 3–8 simple, factual, non-overlapping sub-questions. Do not include explanations. Each sub-question must be on its own line.

Input:
"${question}"

Output (one sub-question per line, no numbering or bullets):
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.().trim();

    console.log('🧠 Raw decomposition output:\n', text); // Debug log

    if (!text) {
      console.warn('⚠️ No decomposition returned');
      return [];
    }

    const lines = text
      .split('\n')
      .map((line) => line.replace(/^[-*0-9.]+\s*/, '').trim())
      .filter((line) => line.length > 0);

    await setCache(cacheKey, JSON.stringify(lines));
    return lines;
  } catch (err) {
    console.error('❌ Error during question decomposition:', err);
    return [];
  }
}
