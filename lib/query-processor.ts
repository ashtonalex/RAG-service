import nlp from 'compromise';

export type QueryType = 'factual' | 'comparison' | 'procedural' | 'conceptual';

export function sanitizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').slice(0, 512);
}

export function classifyQuery(query: string): QueryType {
  const q = query.toLowerCase();

  if (/^(how|what are the steps|what is the process)/.test(q) || /\b(steps|process|procedure|way to)\b/.test(q)) {
    return 'procedural';
  }
  if (/\b(difference|vs|compare|contrast)\b/.test(q)) {
    return 'comparison';
  }
  if (/^(why|explain|reason|what causes)/.test(q)) {
    return 'conceptual';
  }

  return 'factual';
}

// ✅ Improved keyword extraction
export function extractKeywords(query: string): string[] {
  const doc = nlp(query);

  const nounPhrases = doc.nouns().out('array');
  const topics = doc.topics().out('array');
  const terms = doc.terms().out('array');

  const rawKeywords = [...nounPhrases, ...topics, ...terms];

  const cleaned = rawKeywords.map((phrase) =>
    phrase.toLowerCase().replace(/[^\w\s]/g, '').trim()
  );

  return [...new Set(cleaned)].filter(Boolean);
}
