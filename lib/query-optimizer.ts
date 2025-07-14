import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Assign a complexity score to the query based on its structure.
 */
export function scoreQueryComplexity(query: string): number {
  const wordCount = query.split(/\s+/).length;
  const punctuationCount = (query.match(/[?&]/g) || []).length;

  const conjunctions = ['and', 'or', 'but', 'while', 'however', 'whereas', 'although'];
  const conjunctionCount = conjunctions.reduce(
    (acc, word) => acc + (query.toLowerCase().split(word).length - 1),
    0
  );

  // Weighted score
  return wordCount + punctuationCount * 3 + conjunctionCount * 4;
}

/**
 * Determine if a query is considered complex based on the score.
 */
export function isComplexQuery(query: string, threshold = 15): boolean {
  return scoreQueryComplexity(query) >= threshold;
}

/**
 * Use LLM to break down a complex query into multiple simpler sub-questions.
 * Falls back to naive rule-based split if LLM fails.
 */
export async function decomposeQuery(query: string): Promise<string[]> {
  const prompt = `Break down the following question into multiple clear sub-questions if it's complex. Return only a JSON array of sub-questions.\n\n"${query}"`;

  try {
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.();

    const startIndex = text?.indexOf('[');
    const endIndex = text?.lastIndexOf(']');
    const jsonLike = text?.slice(startIndex, endIndex + 1);

    const parsed = JSON.parse(jsonLike ?? '');
    if (Array.isArray(parsed)) {
      return parsed.map(q => q.trim()).filter(Boolean);
    }
  } catch (error) {
    console.warn('⚠️ LLM decomposition failed, falling back to manual split:', error);
  }

  // Fallback: naive split
  const delimiters = /(?:\band\b|\bor\b|;|\?|&)/i;
  return query
    .split(delimiters)
    .map(part => part.trim())
    .filter(Boolean);
}

/**
 * Join multiple sub-questions into a combined prompt for answering.
 */
export function combineSubQueries(subQueries: string[]): string {
  return subQueries.map(q => (q.endsWith('?') ? q : q + '?')).join(' ');
}
