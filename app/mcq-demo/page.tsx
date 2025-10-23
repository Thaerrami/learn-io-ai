'use client';

import React, { useState } from 'react';
import MCQDisplay from '@/components/MCQDisplay';
import { RefreshedMCQ, PerformanceLevel } from '@/lib/types';
import Link from 'next/link';

export default function MCQDemoPage() {
  const [topicId, setTopicId] = useState('financial-analysis');
  const [performanceLevel, setPerformanceLevel] = useState<PerformanceLevel>('beginner');
  const [currentMCQ, setCurrentMCQ] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);

  // Fetch available topics on mount
  React.useEffect(() => {
    fetch('/api/generate-mcq')
      .then((res) => res.json())
      .then((data) => {
        if (data.topics) {
          setAvailableTopics(data.topics);
        }
      })
      .catch((err) => console.error('Error fetching topics:', err));
  }, []);

  const generateMCQ = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-mcq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic_id: topicId,
          performance_level: performanceLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate MCQ');
      }

      const data = await response.json();
      setCurrentMCQ(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error generating MCQ:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            MCQ Generator Demo
          </h1>
          <p className="text-gray-600">
            Generate personalized and refreshed multiple-choice questions based on user performance level
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Question Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Topic Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Topic
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="financial-analysis">Financial Statement Analysis</option>
                <option value="cost-accounting">Cost Accounting</option>
                <option value="budgeting">Budgeting & Forecasting</option>
              </select>
              {availableTopics.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {availableTopics.find((t) => t.topic_id === topicId)?.question_count || 0}{' '}
                  questions available
                </p>
              )}
            </div>

            {/* Performance Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Performance Level
              </label>
              <select
                value={performanceLevel}
                onChange={(e) => setPerformanceLevel(e.target.value as PerformanceLevel)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Based on pre-test performance
              </p>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateMCQ}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Generating Question...' : 'Generate Personalized MCQ'}
          </button>
        </div>

        {/* Feature Highlights */}
        {!currentMCQ && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              🎯 Key Features Demonstrated
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  📊 Pattern-Based Refreshing
                </h4>
                <p className="text-sm text-gray-700">
                  Questions are refreshed differently based on their pattern type:
                  numerical calculations, scenario analysis, or pure recall.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">
                  🎓 Difficulty Preservation
                </h4>
                <p className="text-sm text-gray-700">
                  The core concept and difficulty level remain consistent while
                  specific details are modified for practice variety.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">
                  📚 Didactic Explanations
                </h4>
                <p className="text-sm text-gray-700">
                  Detailed explanations help students learn the concepts, not just
                  memorize answers.
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

        {/* MCQ Display */}
        {currentMCQ && !loading && (
          <div className="mb-8">
            <MCQDisplay mcq={currentMCQ} onNextQuestion={generateMCQ} />
          </div>
        )}

        {/* Implementation Notes */}
        <div className="bg-gray-800 text-white rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🔧 Implementation Notes</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>API Endpoint:</strong> <code>/api/generate-mcq</code>
            </li>
            <li>
              <strong>Model:</strong> GPT-3.5-Turbo (cost-effective for production scale)
            </li>
            <li>
              <strong>Prompt Engineering:</strong> Pattern-specific instructions ensure concept preservation
            </li>
            <li>
              <strong>Question Bank:</strong> Base questions are selected based on topic and difficulty
            </li>
            <li>
              <strong>Scalability:</strong> Stateless API design enables horizontal scaling
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

