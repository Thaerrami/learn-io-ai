'use client';

import React, { useState } from 'react';
import { RefreshedMCQ } from '@/lib/types';

interface MCQDisplayProps {
  mcq: RefreshedMCQ & {
    topic_id?: string;
    base_question_id?: string;
    generated_at?: string;
  };
  onNextQuestion?: () => void;
}

export default function MCQDisplay({ mcq, onNextQuestion }: MCQDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userExplanation, setUserExplanation] = useState('');
  const [showUserExplanationField, setShowUserExplanationField] = useState(false);

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswer(option);
    setShowUserExplanationField(true);
  };

  const handleSubmitExplanation = () => {
    setShowExplanation(true);
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setUserExplanation('');
    setShowUserExplanationField(false);
  };

  const isCorrect = selectedAnswer === mcq.correct_answer;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2">
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
              {mcq.pattern_type.replace('_', ' ').toUpperCase()}
            </span>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              {mcq.difficulty_level.toUpperCase()}
            </span>
          </div>
          {mcq.generated_at && (
            <span className="text-xs text-gray-500">
              Generated: {new Date(mcq.generated_at).toLocaleTimeString()}
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mt-4">{mcq.question_text}</h2>
      </div>

      {/* Answer Options */}
      <div className="space-y-3 mb-6">
        {Object.entries(mcq.options).map(([key, value]) => {
          const isSelected = selectedAnswer === key;
          const isCorrectAnswer = key === mcq.correct_answer;
          
          let buttonClass = 'w-full text-left p-4 border-2 rounded-lg transition-all ';
          
          if (!showExplanation) {
            buttonClass += isSelected
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50';
          } else {
            if (isCorrectAnswer) {
              buttonClass += 'border-green-500 bg-green-50';
            } else if (isSelected && !isCorrectAnswer) {
              buttonClass += 'border-red-500 bg-red-50';
            } else {
              buttonClass += 'border-gray-300 bg-gray-50';
            }
          }

          return (
            <button
              key={key}
              onClick={() => !showUserExplanationField && handleAnswerSelect(key)}
              disabled={showUserExplanationField}
              className={buttonClass}
            >
              <div className="flex items-start">
                <span className="font-bold mr-3 text-lg">{key}.</span>
                <span className="flex-1">{value}</span>
                {showExplanation && isCorrectAnswer && (
                  <span className="ml-2 text-green-600 font-bold">✓</span>
                )}
                {showExplanation && isSelected && !isCorrectAnswer && (
                  <span className="ml-2 text-red-600 font-bold">✗</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* User Explanation Field */}
      {showUserExplanationField && !showExplanation && (
        <div className="mb-6 p-5 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h3 className="font-bold text-lg text-blue-900 mb-3">
            📝 Explain Your Answer
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Before seeing the solution, please explain why you chose option <strong>{selectedAnswer}</strong>. 
            This helps reinforce your learning and understanding.
          </p>
          <textarea
            value={userExplanation}
            onChange={(e) => setUserExplanation(e.target.value)}
            placeholder="Type your explanation here... (e.g., 'I chose this because...')"
            className="w-full p-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            rows={4}
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleSubmitExplanation}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Submit & See Explanation
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Change Answer
            </button>
          </div>
        </div>
      )}

      {/* Explanation */}
      {showExplanation && (
        <div
          className={`p-5 rounded-lg mb-6 ${
            isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
          }`}
        >
          <h3
            className={`font-bold text-lg mb-2 ${
              isCorrect ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
          </h3>

          {/* User's Explanation */}
          {userExplanation && (
            <div className="mb-4 p-3 bg-white bg-opacity-60 rounded border-l-4 border-blue-500">
              <p className="font-semibold text-sm text-blue-900 mb-1">Your Explanation:</p>
              <p className="text-sm text-gray-700 italic">&quot;{userExplanation}&quot;</p>
            </div>
          )}

          {/* Correct Answer with Reference */}
          <div className="text-gray-800">
            <div className="mb-3 p-3 bg-white bg-opacity-60 rounded">
              <p className="font-semibold text-sm mb-1">Correct Answer:</p>
              <p className="text-lg font-bold text-green-700">
                Option {mcq.correct_answer}: {mcq.options[mcq.correct_answer]}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1">
                  📚 <strong>Reference:</strong>
                </span>
                <span>
                  {mcq.pattern_type === 'numerical_calculation' && 'Financial Accounting Standards - Cost of Goods Sold (COGS)'}
                  {mcq.pattern_type === 'scenario_analysis' && 'Managerial Accounting - Capital Budgeting Analysis'}
                  {mcq.pattern_type === 'pure_recall' && 'CPA/CMA Study Guide - Financial Statement Analysis'}
                </span>
              </div>
            </div>

            <p className="font-semibold mb-2">Detailed Explanation:</p>
            <p className="whitespace-pre-line">{mcq.explanation}</p>
            
            {/* Learning Tip */}
            <div className="mt-3 p-3 bg-white bg-opacity-60 rounded border-l-4 border-purple-500">
              <p className="text-sm">
                <strong className="text-purple-700">💡 Learning Tip:</strong>
                <span className="text-gray-700"> 
                  {isCorrect 
                    ? ' Great job! Review your explanation to solidify your understanding.' 
                    : ' Review the explanation carefully and try to understand where your reasoning differed from the correct approach.'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {showExplanation && (
          <>
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
            {onNextQuestion && (
              <button
                onClick={onNextQuestion}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next Question
              </button>
            )}
          </>
        )}
      </div>

      {/* Metadata */}
      {mcq.base_question_id && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            This question was refreshed from base question ID: {mcq.base_question_id}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            The core concept and difficulty remain consistent while the specific details have been modified.
          </p>
        </div>
      )}
    </div>
  );
}

