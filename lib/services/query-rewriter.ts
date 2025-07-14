import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCache, setCache } from '@/lib/cache';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function safeGenerateContent(prompt: string, retries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.();
      console.log('📤 Gemini raw output:\n', text); // ✅ log raw result
      if (text && typeof text === 'string') return text;
    } catch (err: any) {
      if (err?.status === 503 && attempt < retries) {
        console.warn(`🔁 Gemini 503 - retrying (${attempt})...`);
        await new Promise((res) => setTimeout(res, 500 * attempt));
        continue;
      }
      console.error('❌ Gemini SDK error:', err);
      return null;
    }
  }
  return null;
}

/**
 * Rewrite a user's query using sub-questions for guidance.
 */
export async function rewriteBasedOnSubQuestions(
  original: string,
  subQuestions: string[],
  type: string
): Promise<string> {
  const cacheKey = `${type}:sub:${original}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log('✅ Cache hit (sub-question rewrite)');
    return cached;
  }

  const prompt = `You are a helpful assistant rewriting complex questions.

Your task:
- Rewrite the following ${type} question.
- Use the sub-questions as context.
- DO NOT answer the question.
- DO NOT repeat all sub-questions.
- DO NOT include extra explanations.
- ONLY return one rewritten question suitable for high school or undergraduate students.

Original Question:
"${original}"

Sub-Questions:
${subQuestions.map((q) => `- ${q}`).join('\n')}

Rewritten Question:`.trim();

  const rewritten = await safeGenerateContent(prompt);

  if (!rewritten) {
    console.warn('⚠️ No rewritten content received — falling back to original');
    return original;
  }

  const clean = rewritten
    .trim()
    .replace(/^["“]|["”]$/g, '') // remove surrounding quotes
    .replace(/^Rewritten Question: */i, '')
    .split('\n')[0] // grab only the first line
    .trim();

  await setCache(cacheKey, clean);
  return clean;
}

/**
 * Rewrite a user's query with optional sub-questions, caching, length control, and fallback.
 */
export async function rewriteQuery(
  original: string,
  type: string,
  subQuestions?: string[]
): Promise<string> {
  // 🧠 Use sub-question guided rewrite if available
  if (subQuestions && subQuestions.length > 0) {
    return rewriteBasedOnSubQuestions(original, subQuestions, type);
  }

  const cacheKey = `${type}:${original}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log('✅ Cache hit');
    return cached;
  }

  const wordCount = original.trim().split(/\s+/).length;

  let prompt = `Rewrite the following ${type} question to make it clearer and easier to understand.
DO NOT answer the question.
DO NOT add explanations.
ONLY return a rewritten version of the question:\n\n"${original}"`;

  if (wordCount < 10) {
    prompt = `Rewrite this short ${type} question for clarity, but keep it simple and short. Do NOT answer or elaborate:\n\n"${original}"`;
  } else if (wordCount < 20) {
    prompt = `Rewrite this ${type} question with improved structure and clarity. Do NOT answer or explain:\n\n"${original}"`;
  }

  const rewritten = await safeGenerateContent(prompt);

  if (!rewritten) {
    console.warn('⚠️ No rewritten content received — falling back to original');
    return original;
  }

  const clean = rewritten
    .trim()
    .replace(/^["“]|["”]$/g, '') // remove quotes
    .replace(/^Rewritten Question: */i, '')
    .split('\n')[0]
    .trim();

  await setCache(cacheKey, clean);
  return clean;
}

