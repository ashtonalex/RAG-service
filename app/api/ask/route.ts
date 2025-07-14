import { NextRequest, NextResponse } from 'next/server';
import { sanitizeQuery, classifyQuery, extractKeywords } from '@/lib/query-processor';
import { rewriteQuery } from '@/lib/services/query-rewriter';
import { scoreQueryComplexity, isComplexQuery } from '@/lib/query-optimizer';
import { decomposeQuestion } from '@/lib/utils/decompose';
import { getAnswerForSubQuestion } from '@/lib/services/sub-question-answer';

export async function POST(req: NextRequest) {
  try {
    const { question, projectId } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ detail: 'Invalid question' }, { status: 400 });
    }

    const sanitized = sanitizeQuery(question);
    const queryType = classifyQuery(sanitized);
    const keywords = extractKeywords(sanitized);

    const complexityScore = scoreQueryComplexity(sanitized);
    const isComplex = isComplexQuery(sanitized);

    // 🔍 Decompose FIRST before rewriting
    const subQuestions = isComplex ? await decomposeQuestion(sanitized) : [];

    if (isComplex && subQuestions.length === 0) {
      console.warn('⚠️ Expected sub-questions but got none.');
    }

    // ✨ Rewrite with sub-question guidance if possible
    const rewritten = await rewriteQuery(sanitized, queryType, subQuestions);
    console.log('🧠 Sub-questions generated:', subQuestions);

    // ✅ Get answers for each sub-question
    let combinedAnswer = '';
    if (subQuestions.length > 0) {
      const answers = [];
      for (const subQ of subQuestions) {
        const answer = await getAnswerForSubQuestion(subQ);
        answers.push(answer);
        await new Promise((res) => setTimeout(res, 300)); // avoid 429
      }

      combinedAnswer = answers
        .map((a, i) => {
          if (a === '⚠️ No answer generated') {
            return `**Q${i + 1}:** ${subQuestions[i]}\n**A:** *(No answer generated)*`;
          }
          return `**Q${i + 1}:** ${subQuestions[i]}\n**A:** ${a}`;
        })
        .join('\n\n');
    }

    return NextResponse.json({
      projectId,
      sanitizedQuestion: sanitized,
      queryType,
      keywords,
      complexityScore,
      isComplex,
      subQuestions,
      rewrittenQuestion: rewritten,
      combinedAnswer,
    });
  } catch (error) {
    console.error('❌ Error in /api/ask:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}
