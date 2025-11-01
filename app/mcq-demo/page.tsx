'use client';

import { useState } from 'react';

interface Source {
  source: string;
  page?: number;
  excerpt: string;
}

interface MCQResponse {
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  source_page?: number;
  pattern_type: string;
  difficulty_level: string;
  topic_id: string;
  sources: Source[];
  generated_at: string;
  model_used: string;
}

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: '🌱 Beginner', description: 'Basic recall and understanding' },
  { value: 'intermediate', label: '🌿 Intermediate', description: 'Application and analysis' },
  { value: 'advanced', label: '🌳 Advanced', description: 'Complex scenarios and synthesis' },
];

const PATTERN_TYPES = [
  { value: 'pure_recall', label: '📝 Pure Recall', description: 'Definition and facts' },
  { value: 'numerical_calculation', label: '🔢 Numerical Calculation', description: 'Math and formulas' },
  { value: 'scenario_analysis', label: '🎯 Scenario Analysis', description: 'Real-world application' },
];

export default function MCQGeneratorDemo() {
  const [topicId, setTopicId] = useState('Cost Behavior');
  const [originalQuestion, setOriginalQuestion] = useState('What are the different types of costs in management accounting?');
  const [userLevel, setUserLevel] = useState('intermediate');
  const [patternType, setPatternType] = useState('scenario_analysis');
  const [mcq, setMcq] = useState<MCQResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleGenerateMCQ = async () => {
    setLoading(true);
    setError('');
    setMcq(null);
    setSelectedAnswer(null);
    setShowExplanation(false);

    try {
      const response = await fetch('/api/generate-mcq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic_id: topicId,
          original_question: originalQuestion,
          user_performance_level: userLevel,
          pattern_type: patternType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate MCQ');
      }

      const data = await response.json();
      setMcq(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the MCQ');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswer(option);
    setShowExplanation(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎓 MCQ Generator with RAG
          </h1>
          <p className="text-lg text-gray-600">
            Generate adaptive questions based on user level using ChromaDB and Testbank examples
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic
              </label>
              <input
                type="text"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Cost Behavior, Break-even Analysis"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Question or Concept
              </label>
              <textarea
                value={originalQuestion}
                onChange={(e) => setOriginalQuestion(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter a question or concept to generate variations from..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Level Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Level
                </label>
                <select
                  value={userLevel}
                  onChange={(e) => setUserLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  {DIFFICULTY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {DIFFICULTY_LEVELS.find(l => l.value === userLevel)?.description}
                </p>
              </div>

              {/* Pattern Type Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Pattern
                </label>
                <select
                  value={patternType}
                  onChange={(e) => setPatternType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  {PATTERN_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {PATTERN_TYPES.find(t => t.value === patternType)?.description}
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateMCQ}
              disabled={loading || !topicId || !originalQuestion}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Question...
                </span>
              ) : (
                '🎯 Generate MCQ'
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

        {/* MCQ Display */}
        {mcq && (
          <div className="space-y-6">
            {/* Question */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {mcq.difficulty_level}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {mcq.pattern_type}
                  </span>
                </div>
                {mcq.source_page && (
                  <span className="text-sm text-gray-600">
                    📄 Page {mcq.source_page}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {mcq.question_text}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {Object.entries(mcq.options).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleAnswerSelect(key)}
                    disabled={selectedAnswer !== null}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedAnswer === null
                        ? 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                        : selectedAnswer === key
                        ? key === mcq.correct_answer
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : key === mcq.correct_answer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <span className="font-semibold mr-2">{key}.</span>
                    <span>{value}</span>
                    {selectedAnswer !== null && key === mcq.correct_answer && (
                      <span className="ml-2 text-green-600">✓ Correct</span>
                    )}
                    {selectedAnswer === key && key !== mcq.correct_answer && (
                      <span className="ml-2 text-red-600">✗ Incorrect</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  💡 Explanation
                </h4>
                <p className="text-gray-700 whitespace-pre-line">
                  {mcq.explanation}
                </p>
              </div>
            )}

            {/* Sources */}
            {mcq.sources && mcq.sources.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  📚 Sources
                </h4>
                <div className="space-y-3">
                  {mcq.sources.map((source, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-purple-500 bg-purple-50 p-3 rounded"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-purple-900">
                          {source.source}
                        </span>
                        {source.page && (
                          <span className="text-sm text-purple-700">
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

            {/* Meta Info */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 text-center">
              Generated with {mcq.model_used} on {new Date(mcq.generated_at).toLocaleString()}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!mcq && !loading && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              🎯 How It Works
            </h3>
            <p className="text-purple-800 mb-4">
              This generator uses RAG to create questions based on actual textbook content and testbank examples.
            </p>
            <div className="text-left bg-white p-4 rounded border border-purple-200 space-y-2">
              <p className="text-sm text-gray-700">
                ✨ <strong>Student Level:</strong> Adjusts question complexity and depth
              </p>
              <p className="text-sm text-gray-700">
                ✨ <strong>Question Pattern:</strong> Determines the type of cognitive skill tested
              </p>
              <p className="text-sm text-gray-700">
                ✨ <strong>Source Attribution:</strong> Each question includes references to the original material
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
