import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCache, setCache } from '@/lib/cache';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function safeGenerateContent(prompt: string, retries = 3): Promise<string | null> {
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.();
      return text?.trim() || null;
    } catch (error: any) {
      if ((error.status === 429 || error.status === 503) && attempt < retries - 1) {
        const wait = (attempt + 1) * 2000;
        console.warn(`🔁 Gemini retry ${attempt + 1} in ${wait}ms...`);
        await delay(wait);
      } else {
        console.error('❌ Gemini error:', error);
        return null;
      }
    }
  }

  return null;
}

// ✏️ Rewrites original question concisely and clearly
export async function rewriteQuery(original: string, type: string): Promise<string> {
  const cacheKey = `rewrite:${type}:${original}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log('✅ Rewrite cache hit');
    return cached;
  }

  const prompt = `Rewrite this ${type} question to make it clearer and slightly more specific. Keep the length similar to the original and avoid detailed explanations:\n\n"${original}"`;
  const rewritten = await safeGenerateContent(prompt);

  if (!rewritten) return original;

  const final = rewritten.trim().replace(/^["“]|["”]$/g, '');
  await setCache(cacheKey, final);
  return final;
}

// 🔍 Breaks down question into 8–10 sub-questions
export async function generateSubQuestions(rewritten: string): Promise<string[]> {
  const cacheKey = `subqgen:${rewritten}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log('✅ Sub-question generation cache hit');
    return JSON.parse(cached); // ✅ FIXED
  }

  const prompt = `Break the following question into 8 to 10 concise sub-questions. Only list the sub-questions without explanations or answers:\n\n"${rewritten}"\n\n1.`;

  const raw = await safeGenerateContent(prompt);
  if (!raw) return [];

  const subQuestions = raw
    .split('\n')
    .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter((q) => q.length > 10 && q.endsWith('?'));

  await setCache(cacheKey, JSON.stringify(subQuestions)); // ✅ FIXED
  return subQuestions;
}

// ✅ Answers a single sub-question
export async function getAnswerForSubQuestion(question: string): Promise<string> {
  const cacheKey = `subq:${question}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log('✅ Sub-question cache hit');
    return cached;
  }

  const prompt = `Answer the following question clearly and concisely (1 paragraph max):\n\n"${question}"`;
  const answer = await safeGenerateContent(prompt);

  if (answer) {
    await setCache(cacheKey, answer);
    return answer;
  }

  return '⚠️ No answer generated';
}

