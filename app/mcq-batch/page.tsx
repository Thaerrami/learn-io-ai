'use client';

import { useState } from 'react';

interface BatchMCQQuestion {
  question_number: number;
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
  generated_at: string;
  model_used: string;
}

interface BatchMCQResponse {
  questions: BatchMCQQuestion[];
  total_questions: number;
  topic_id: string;
  difficulty_level: string;
  pattern_type: string;
  sources: any[];
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
  { value: 'mixed', label: '🔄 Mixed Types', description: 'Variety of question types' },
];

export default function BatchMCQGenerator() {
  const [topicId, setTopicId] = useState('Cost Behavior');
  const [originalQuestion, setOriginalQuestion] = useState('What are the different types of costs in management accounting?');
  const [userLevel, setUserLevel] = useState('intermediate');
  const [patternType, setPatternType] = useState('mixed');
  const [questionCount, setQuestionCount] = useState(15);
  const [batchMCQ, setBatchMCQ] = useState<BatchMCQResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
  const [showExplanations, setShowExplanations] = useState<{[key: number]: boolean}>({});
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const handleGenerateBatchMCQ = async () => {
    setLoading(true);
    setError('');
    setBatchMCQ(null);
    setSelectedAnswers({});
    setShowExplanations({});
    setShowAnswerKey(false);

    try {
      const response = await fetch('/api/generate-mcq-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic_id: topicId,
          original_question: originalQuestion,
          user_performance_level: userLevel,
          pattern_type: patternType,
          question_count: questionCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate batch MCQs');
      }

      const data = await response.json();
      setBatchMCQ(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the MCQs');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionNumber: number, option: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionNumber]: option
    }));
  };

  const toggleExplanation = (questionNumber: number) => {
    setShowExplanations(prev => ({
      ...prev,
      [questionNumber]: !prev[questionNumber]
    }));
  };

  const calculateScore = () => {
    if (!batchMCQ) return { correct: 0, total: 0, percentage: 0 };
    
    let correct = 0;
    batchMCQ.questions.forEach(q => {
      if (selectedAnswers[q.question_number] === q.correct_answer) {
        correct++;
      }
    });
    
    return {
      correct,
      total: batchMCQ.questions.length,
      percentage: Math.round((correct / batchMCQ.questions.length) * 100)
    };
  };

  const exportQuestions = () => {
    if (!batchMCQ) return;
    
    let content = `${topicId} - Practice Questions\n`;
    content += `Generated: ${new Date(batchMCQ.generated_at).toLocaleDateString()}\n`;
    content += `Difficulty: ${userLevel} | Type: ${patternType} | Total: ${batchMCQ.total_questions}\n\n`;
    
    batchMCQ.questions.forEach(q => {
      content += `Question ${q.question_number}: ${q.question_text}\n`;
      content += `A) ${q.options.A}\n`;
      content += `B) ${q.options.B}\n`;
      content += `C) ${q.options.C}\n`;
      content += `D) ${q.options.D}\n`;
      if (showAnswerKey) {
        content += `Correct Answer: ${q.correct_answer}\n`;
        content += `Explanation: ${q.explanation}\n`;
      }
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topicId}_${questionCount}_Questions.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { correct, total, percentage } = calculateScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Batch MCQ Generator
          </h1>
          <p className="text-lg text-gray-600">
            Generate 15-20 practice questions using RAG with your educational content
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic/Subject
                </label>
                <input
                  type="text"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Cost Behavior, Financial Ratios"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="10">10 Questions</option>
                  <option value="15">15 Questions</option>
                  <option value="20">20 Questions</option>
                  <option value="25">25 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <div className="space-y-2">
                  {DIFFICULTY_LEVELS.map((level) => (
                    <label key={level.value} className="flex items-center">
                      <input
                        type="radio"
                        name="difficulty"
                        value={level.value}
                        checked={userLevel === level.value}
                        onChange={(e) => setUserLevel(e.target.value)}
                        className="mr-3 text-indigo-600"
                      />
                      <div>
                        <span className="font-medium">{level.label}</span>
                        <span className="text-sm text-gray-500 ml-2">{level.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Question/Topic Focus
                </label>
                <textarea
                  value={originalQuestion}
                  onChange={(e) => setOriginalQuestion(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe the main topic or provide a sample question to guide the generation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Pattern
                </label>
                <div className="space-y-2">
                  {PATTERN_TYPES.map((pattern) => (
                    <label key={pattern.value} className="flex items-center">
                      <input
                        type="radio"
                        name="pattern"
                        value={pattern.value}
                        checked={patternType === pattern.value}
                        onChange={(e) => setPatternType(e.target.value)}
                        className="mr-3 text-indigo-600"
                      />
                      <div>
                        <span className="font-medium">{pattern.label}</span>
                        <span className="text-sm text-gray-500 ml-2">{pattern.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleGenerateBatchMCQ}
              disabled={loading || !topicId || !originalQuestion}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating {questionCount} Questions...
                </span>
              ) : (
                `✨ Generate ${questionCount} MCQ Questions`
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

        {/* Results Display */}
        {batchMCQ && (
          <div className="space-y-6">
            {/* Header Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {batchMCQ.topic_id} - Practice Questions
                  </h2>
                  <p className="text-gray-600">
                    {batchMCQ.total_questions} questions • {batchMCQ.difficulty_level} level • {batchMCQ.pattern_type}
                  </p>
                  {Object.keys(selectedAnswers).length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Progress: {Object.keys(selectedAnswers).length}/{batchMCQ.total_questions} answered
                      {Object.keys(selectedAnswers).length === batchMCQ.total_questions && (
                        <span className="ml-2 font-medium">
                          Score: {correct}/{total} ({percentage}%)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    {showAnswerKey ? '🙈 Hide' : '👁️ Show'} Answers
                  </button>
                  <button
                    onClick={exportQuestions}
                    className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors"
                  >
                    📄 Export
                  </button>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {batchMCQ.questions.map((question) => (
                <div key={question.question_number} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Question {question.question_number}: {question.question_text}
                    </h3>
                    
                    <div className="space-y-2">
                      {Object.entries(question.options).map(([option, text]) => {
                        const isSelected = selectedAnswers[question.question_number] === option;
                        const isCorrect = question.correct_answer === option;
                        const showResult = showAnswerKey || showExplanations[question.question_number];
                        
                        let buttonClass = "w-full text-left p-3 rounded-lg border transition-colors ";
                        if (showResult && isCorrect) {
                          buttonClass += "bg-green-100 border-green-300 text-green-800";
                        } else if (showResult && isSelected && !isCorrect) {
                          buttonClass += "bg-red-100 border-red-300 text-red-800";
                        } else if (isSelected) {
                          buttonClass += "bg-indigo-100 border-indigo-300 text-indigo-800";
                        } else {
                          buttonClass += "bg-gray-50 border-gray-200 hover:bg-gray-100";
                        }
                        
                        return (
                          <button
                            key={option}
                            onClick={() => handleAnswerSelect(question.question_number, option)}
                            className={buttonClass}
                          >
                            <span className="font-medium">{option})</span> {text}
                            {showResult && isCorrect && <span className="ml-2">✅</span>}
                            {showResult && isSelected && !isCorrect && <span className="ml-2">❌</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <button
                      onClick={() => toggleExplanation(question.question_number)}
                      className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {showExplanations[question.question_number] ? '🔼 Hide' : '🔽 Show'} Explanation
                    </button>
                    
                    {showAnswerKey && (
                      <span className="text-sm text-gray-600">
                        Correct Answer: <strong>{question.correct_answer}</strong>
                      </span>
                    )}
                  </div>

                  {(showExplanations[question.question_number] || showAnswerKey) && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                      <p className="text-blue-800 text-sm">{question.explanation}</p>
                      {question.source_page && (
                        <p className="text-blue-600 text-xs mt-2">
                          Source: Page {question.source_page}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Final Score */}
            {Object.keys(selectedAnswers).length === batchMCQ.total_questions && (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  🎯 Final Score: {correct}/{total} ({percentage}%)
                </h3>
                <p className="text-gray-600 mb-4">
                  {percentage >= 80 ? '🎉 Excellent work!' :
                   percentage >= 70 ? '👍 Good job!' :
                   percentage >= 60 ? '📚 Keep studying!' :
                   '💪 More practice needed!'}
                </p>
                <button
                  onClick={exportQuestions}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  📄 Export Questions & Answers
                </button>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!batchMCQ && !loading && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">
              🚀 Batch MCQ Generator
            </h3>
            <p className="text-indigo-800 mb-4">
              Generate 15-20 practice questions based on your educational content in ChromaDB.
            </p>
            <div className="text-left bg-white p-4 rounded border border-indigo-200 space-y-2">
              <p className="text-sm text-gray-800">
                <strong>Features:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Generate 10-25 questions at once</li>
                <li>• Multiple difficulty levels and question types</li>
                <li>• Interactive quiz mode with scoring</li>
                <li>• Export questions for offline study</li>
                <li>• Based on your ChromaDB content</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
