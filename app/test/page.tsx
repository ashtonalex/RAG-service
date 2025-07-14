'use client';

import { useState } from 'react';
import { askQuestion } from '../api/askQuestion'; // adjust the path if needed

export default function TestAskPage() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      const res = await askQuestion("demo-project", question);
      setResult(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setResult("Error: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Ask a Question</h1>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        placeholder="Type your question here..."
      />
      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Submit
      </button>

      {result && (
        <pre className="mt-6 bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
