// Type definitions for the application

export type PatternType = 'numerical_calculation' | 'scenario_analysis' | 'pure_recall';

export type PerformanceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Question {
  id: string;
  topic_id: string;
  original_question: string;
  correct_answer: string;
  explanation: string;
  pattern_type: PatternType;
  difficulty_level: PerformanceLevel;
  options?: string[];
}

export interface UserProfile {
  user_id: string;
  performance_level: PerformanceLevel;
  completed_topics: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface RefreshedMCQ {
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  pattern_type: PatternType;
  difficulty_level: PerformanceLevel;
}

export interface ChapterSummary {
  chapter_name: string;
  summary_text: string;
  core_keywords: string[];
  generated_at: string;
}

export interface RAGSearchResult {
  keyword: string;
  relevant_chunks: string[];
  source_page?: number;
}

