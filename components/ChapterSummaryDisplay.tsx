'use client';

import React, { useState, useMemo } from 'react';
import { RAGSearchResult } from '@/lib/types';

interface ChapterSummaryDisplayProps {
  summary_text: string;
  core_keywords: string[];
  rag_definitions?: Record<string, RAGSearchResult>;
}

interface KeywordTooltip {
  keyword: string;
  position: { top: number; left: number };
  definition: string[];
}

export default function ChapterSummaryDisplay({
  summary_text,
  core_keywords,
  rag_definitions,
}: ChapterSummaryDisplayProps) {
  const [activeTooltip, setActiveTooltip] = useState<KeywordTooltip | null>(null);
  const [loadingKeyword, setLoadingKeyword] = useState<string | null>(null);

  /**
   * Handle keyword click - fetches definition via RAG if not already loaded
   */
  const handleKeywordClick = async (
    keyword: string,
    event: React.MouseEvent<HTMLSpanElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    
    // If we already have RAG definitions from the initial load
    if (rag_definitions && rag_definitions[keyword]) {
      setActiveTooltip({
        keyword,
        position: { 
          top: rect.bottom + window.scrollY + 5, 
          left: rect.left + window.scrollX 
        },
        definition: rag_definitions[keyword].relevant_chunks,
      });
      return;
    }

    // Otherwise, fetch the definition dynamically
    setLoadingKeyword(keyword);

    try {
      // In production, this would be an API call to fetch RAG results
      // For demo, we'll simulate with a timeout
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Mock fetch - in production: const response = await fetch('/api/rag-search', { method: 'POST', body: JSON.stringify({ keyword }) });
      const mockDefinition = [
        `Definition for "${keyword}": This is a dynamically fetched definition that would come from your RAG system in production.`,
        `This demonstrates the feasibility of the keyword linking feature, showing how clicking on key terms can fetch detailed explanations from your vector database.`,
      ];

      setActiveTooltip({
        keyword,
        position: { 
          top: rect.bottom + window.scrollY + 5, 
          left: rect.left + window.scrollX 
        },
        definition: mockDefinition,
      });
    } catch (error) {
      console.error('Error fetching keyword definition:', error);
    } finally {
      setLoadingKeyword(null);
    }
  };

  /**
   * Process summary text to wrap keywords with clickable spans
   * Uses a sophisticated approach to handle multi-word keywords and avoid double-wrapping
   */
  const processedSummary = useMemo(() => {
    let processedText = summary_text;
    
    // Sort keywords by length (longest first) to handle multi-word keywords properly
    const sortedKeywords = [...core_keywords].sort((a, b) => b.length - a.length);
    
    // Create a map to store placeholder replacements
    const replacements: { placeholder: string; element: string }[] = [];
    
    sortedKeywords.forEach((keyword, index) => {
      const placeholder = `__KEYWORD_${index}__`;
      
      // Create case-insensitive regex that matches whole words/phrases
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${escapedKeyword})\\b`, 'gi');
      
      // Replace all occurrences with placeholder
      processedText = processedText.replace(regex, placeholder);
      
      // Store the replacement HTML
      replacements.push({
        placeholder,
        element: `<span class="keyword-highlight" data-keyword="${keyword}">${keyword}</span>`,
      });
    });
    
    // Replace all placeholders with actual HTML
    replacements.forEach(({ placeholder, element }) => {
      processedText = processedText.replace(new RegExp(placeholder, 'g'), element);
    });
    
    return processedText;
  }, [summary_text, core_keywords]);

  /**
   * Handle clicks on keyword spans
   */
  const handleSummaryClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    
    if (target.classList.contains('keyword-highlight')) {
      const keyword = target.getAttribute('data-keyword');
      if (keyword) {
        handleKeywordClick(keyword, event as any);
      }
    }
  };

  /**
   * Close tooltip when clicking outside
   */
  const handleCloseTooltip = () => {
    setActiveTooltip(null);
  };

  return (
    <div className="relative">
      {/* Summary Text with Clickable Keywords */}
      <div
        className="summary-content prose prose-sm max-w-none"
        onClick={handleSummaryClick}
        dangerouslySetInnerHTML={{ __html: processedSummary }}
      />

      {/* Loading Indicator */}
      {loadingKeyword && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Loading definition for "{loadingKeyword}"...
        </div>
      )}

      {/* Keyword Tooltip/Overlay */}
      {activeTooltip && (
        <>
          {/* Backdrop to close tooltip */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseTooltip}
          />
          
          {/* Tooltip Content */}
          <div
            className="absolute z-50 bg-white border-2 border-blue-500 rounded-lg shadow-xl p-4 max-w-md"
            style={{
              top: `${activeTooltip.position.top}px`,
              left: `${activeTooltip.position.left}px`,
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-blue-700">
                {activeTooltip.keyword}
              </h3>
              <button
                onClick={handleCloseTooltip}
                className="text-gray-500 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {activeTooltip.definition.map((chunk, index) => (
                <p key={index} className="text-sm text-gray-700">
                  {chunk}
                </p>
              ))}
            </div>
            
            <div className="mt-3 text-xs text-gray-500 italic">
              Source: Original course materials (RAG)
            </div>
          </div>
        </>
      )}

      {/* Keyword Legend */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-sm text-blue-900 mb-2">Core Keywords:</h4>
        <div className="flex flex-wrap gap-2">
          {core_keywords.map((keyword) => (
            <span
              key={keyword}
              className="keyword-highlight cursor-pointer"
              data-keyword={keyword}
              onClick={(e) => handleKeywordClick(keyword, e)}
            >
              {keyword}
            </span>
          ))}
        </div>
        <p className="text-xs text-blue-700 mt-2">
          💡 Click on any highlighted keyword in the summary or above to see its definition from the source material.
        </p>
      </div>

      {/* Styles for keyword highlighting */}
      <style jsx>{`
        .summary-content :global(.keyword-highlight) {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 2px 4px;
          border-radius: 3px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .summary-content :global(.keyword-highlight:hover) {
          background-color: #bfdbfe;
          color: #1e3a8a;
          text-decoration: underline;
        }
        
        .keyword-highlight {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 2px 6px;
          border-radius: 3px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          display: inline-block;
        }
        
        .keyword-highlight:hover {
          background-color: #bfdbfe;
          color: #1e3a8a;
          transform: translateY(-1px);
        }
        
        .summary-content {
          line-height: 1.8;
          font-size: 1rem;
        }
        
        .summary-content :global(p) {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}

