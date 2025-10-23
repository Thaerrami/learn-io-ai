'use client';

import React, { useState } from 'react';
import ChapterSummaryDisplay from '@/components/ChapterSummaryDisplay';
import Link from 'next/link';

export default function ChapterSummaryPage() {
  const [chapterName, setChapterName] = useState('Financial Statement Analysis');
  const [includeRAGLinks, setIncludeRAGLinks] = useState(true);
  const [currentSummary, setCurrentSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableChapters, setAvailableChapters] = useState<any[]>([]);

  // Fetch available chapters on mount
  React.useEffect(() => {
    fetch('/api/chapter-summary')
      .then((res) => res.json())
      .then((data) => {
        if (data.available_chapters) {
          setAvailableChapters(data.available_chapters);
        }
      })
      .catch((err) => console.error('Error fetching chapters:', err));
  }, []);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chapter-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapter_name: chapterName,
          include_rag_links: includeRAGLinks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      setCurrentSummary(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error generating summary:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-800 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Chapter Summary Generator
          </h1>
          <p className="text-gray-600">
            Generate comprehensive chapter abstractions with linked keywords and RAG-powered definitions
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Summary Parameters
          </h2>

          <div className="space-y-6 mb-6">
            {/* Chapter Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Chapter
              </label>
              <select
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                {availableChapters.length > 0 ? (
                  availableChapters.map((chapter) => (
                    <option key={chapter.chapter_id} value={chapter.chapter_name}>
                      {chapter.chapter_name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Financial Statement Analysis">
                      Financial Statement Analysis
                    </option>
                    <option value="Cost Accounting Fundamentals">
                      Cost Accounting Fundamentals
                    </option>
                    <option value="Budgeting and Forecasting">
                      Budgeting and Forecasting
                    </option>
                  </>
                )}
              </select>
            </div>

            {/* RAG Links Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rag-toggle"
                checked={includeRAGLinks}
                onChange={(e) => setIncludeRAGLinks(e.target.checked)}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="rag-toggle" className="ml-3 text-sm font-semibold text-gray-700">
                Include RAG-powered keyword definitions
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-8">
              When enabled, keyword definitions are pre-loaded from the vector database (simulated with mock data)
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateSummary}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {loading ? 'Generating Summary...' : 'Generate Chapter Summary'}
          </button>
        </div>

        {/* Feature Highlights */}
        {!currentSummary && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              ✨ Key Features Demonstrated
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">
                  📖 Comprehensive Abstraction
                </h4>
                <p className="text-sm text-gray-700">
                  Summaries are designed as review tools, focusing on key concepts,
                  formulas, and rules for effective studying.
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  🔗 Keyword Linking
                </h4>
                <p className="text-sm text-gray-700">
                  Core keywords are automatically identified and linked to original
                  source material via RAG search.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">
                  💡 Interactive Learning
                </h4>
                <p className="text-sm text-gray-700">
                  Click any keyword to see its definition from the original course
                  materials, enhancing understanding.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-8">
            <h3 className="font-bold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating comprehensive chapter summary...</p>
            <p className="text-sm text-gray-500 mt-2">This may take 10-15 seconds</p>
          </div>
        )}

        {/* Summary Display */}
        {currentSummary && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {currentSummary.chapter_name}
              </h2>
              <p className="text-sm text-gray-500">
                Generated at: {new Date(currentSummary.generated_at).toLocaleString()}
              </p>
            </div>

            <ChapterSummaryDisplay
              summary_text={currentSummary.summary_text}
              core_keywords={currentSummary.core_keywords}
              rag_definitions={currentSummary.rag_definitions}
            />
          </div>
        )}

        {/* RAG Implementation Flow */}
        {currentSummary && !loading && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">🔄 RAG Implementation Flow</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>
                  <strong>Chapter Summary Generation:</strong> OpenAI generates comprehensive
                  summary and identifies core keywords
                </span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>
                  <strong>Keyword Extraction:</strong> {currentSummary.core_keywords.length}{' '}
                  core keywords identified: {currentSummary.core_keywords.join(', ')}
                </span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>
                  <strong>RAG Search:</strong> Each keyword is passed to{' '}
                  <code className="bg-white bg-opacity-20 px-2 py-1 rounded">
                    RAG_Search_Function(keyword)
                  </code>{' '}
                  which queries the vector database
                </span>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>
                  <strong>Frontend Linking:</strong> Keywords are highlighted and clickable,
                  displaying source material on interaction
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Implementation Notes */}
        <div className="bg-gray-800 text-white rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🔧 Implementation Notes</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>API Endpoint:</strong> <code>/api/chapter-summary</code>
            </li>
            <li>
              <strong>Model:</strong> GPT-3.5-Turbo (can be upgraded to GPT-4 for higher quality)
            </li>
            <li>
              <strong>RAG Service:</strong> Mock implementation using keyword matching; production
              would use vector embeddings
            </li>
            <li>
              <strong>Vector Database:</strong> Mock data simulates Pinecone/Weaviate; stores PDF
              chunks with embeddings
            </li>
            <li>
              <strong>Cost Optimization:</strong> Pre-loading RAG definitions reduces frontend API
              calls
            </li>
            <li>
              <strong>Keyword Highlighting:</strong> Client-side string processing with collision
              handling
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

