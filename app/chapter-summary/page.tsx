'use client';

import { useState, useEffect } from 'react';

interface Source {
  source: string;
  page?: number;
  excerpt: string;
}

interface ChapterSummary {
  chapter_name: string;
  summary_text: string;
  core_keywords: string[];
  sources: Source[];
  generated_at: string;
  model_used: string;
}

export default function ChapterSummaryDemo() {
  const [chapterName, setChapterName] = useState('Chapter 1: Introduction to Management Accounting');
  const [keywords, setKeywords] = useState('cost behavior, fixed costs, variable costs, mixed costs');
  const [summary, setSummary] = useState<ChapterSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chromaStatus, setChromaStatus] = useState<any>(null);

  // Check ChromaDB status on mount
  useEffect(() => {
    const checkChromaStatus = async () => {
      try {
        const response = await fetch('/api/ingest-pdf');
        if (response.ok) {
          const data = await response.json();
          setChromaStatus(data);
        } else {
          console.warn('ChromaDB status check failed:', response.status);
          setChromaStatus({ status: 'disconnected', document_count: 0 });
        }
      } catch (err) {
        console.error('Failed to check ChromaDB status:', err);
        setChromaStatus({ status: 'disconnected', document_count: 0 });
      }
    };

    checkChromaStatus();
  }, []);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError('');
    setSummary(null);

    try {
      const keywordsArray = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const response = await fetch('/api/chapter-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapter_name: chapterName,
          core_keywords: keywordsArray,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Chapter Summary Generator
          </h1>
          <p className="text-lg text-gray-600">
            Generate comprehensive summaries using RAG with ChromaDB
          </p>
          
          {/* ChromaDB Status */}
          {chromaStatus && (
            <div className={`mt-4 inline-flex items-center px-4 py-2 rounded-full text-sm ${
              chromaStatus.status === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <span className="mr-2">
                {chromaStatus.status === 'connected' ? '✅' : '❌'}
              </span>
              {chromaStatus.status === 'connected' 
                ? `ChromaDB Connected (${chromaStatus.document_count} documents)` 
                : 'ChromaDB Disconnected'}
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter Name
              </label>
              <input
                type="text"
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Chapter 1: Introduction to Management Accounting"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Core Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., cost behavior, fixed costs, variable costs"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter keywords to focus the summary on specific topics
              </p>
            </div>

            <button
              onClick={handleGenerateSummary}
              disabled={loading || !chapterName || !keywords}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Summary...
                </span>
              ) : (
                '✨ Generate Summary'
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Display */}
        {summary && (
          <div className="space-y-6">
            {/* Summary Text */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {summary.chapter_name}
              </h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                {summary.summary_text}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Generated with {summary.model_used}</span>
                  <span>{new Date(summary.generated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📌 Core Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.core_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Sources */}
            {summary.sources && summary.sources.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  📖 Sources
                </h3>
                <div className="space-y-3">
                  {summary.sources.map((source, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-blue-900">
                          {source.source}
                        </span>
                        {source.page && (
                          <span className="text-sm text-blue-700">
                            Page {source.page}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 italic">
                        {source.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!summary && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🚀 Getting Started
            </h3>
            <p className="text-blue-800 mb-4">
              Make sure ChromaDB is running and PDFs are ingested before generating summaries.
            </p>
            <div className="text-left bg-white p-4 rounded border border-blue-200 space-y-2">
              <p className="text-sm font-mono text-gray-800">
                1. Start ChromaDB: <code className="bg-gray-100 px-2 py-1 rounded">docker run -p 8000:8000 chromadb/chroma</code>
              </p>
              <p className="text-sm font-mono text-gray-800">
                2. Ingest PDFs: <code className="bg-gray-100 px-2 py-1 rounded">npx ts-node scripts/ingestPDFs.ts</code>
              </p>
              <p className="text-sm font-mono text-gray-800">
                3. Generate summaries with the form above!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
