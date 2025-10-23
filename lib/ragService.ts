import { mockPDFChunks } from './mockData';
import { RAGSearchResult } from './types';

/**
 * Mock RAG Search Function
 * In production, this would query a vector database (e.g., Pinecone, Weaviate, ChromaDB)
 * For the demo, we're using a simple keyword matching against mock PDF chunks
 */
export function RAG_Search_Function(keyword: string): RAGSearchResult {
  const normalizedKeyword = keyword.toLowerCase().trim();
  
  // Try exact match first
  if (mockPDFChunks[normalizedKeyword]) {
    return {
      keyword,
      relevant_chunks: mockPDFChunks[normalizedKeyword],
      source_page: Math.floor(Math.random() * 50) + 1, // Mock page number
    };
  }

  // Try partial matching
  const matchingKey = Object.keys(mockPDFChunks).find((key) =>
    key.includes(normalizedKeyword) || normalizedKeyword.includes(key)
  );

  if (matchingKey) {
    return {
      keyword,
      relevant_chunks: mockPDFChunks[matchingKey],
      source_page: Math.floor(Math.random() * 50) + 1,
    };
  }

  // If no match found, return a generic response
  return {
    keyword,
    relevant_chunks: [
      `Definition for "${keyword}" is not available in the current knowledge base. This term may require additional reference materials or expert consultation.`,
    ],
    source_page: undefined,
  };
}

/**
 * Batch RAG search for multiple keywords
 */
export function batchRAGSearch(keywords: string[]): Record<string, RAGSearchResult> {
  const results: Record<string, RAGSearchResult> = {};
  
  for (const keyword of keywords) {
    results[keyword] = RAG_Search_Function(keyword);
  }
  
  return results;
}

/**
 * Simulate vector database semantic search
 * In production, this would use embeddings and similarity search
 */
export async function semanticSearch(query: string, topK: number = 3): Promise<string[]> {
  // For demo purposes, we'll do a simple keyword-based search
  const allChunks = Object.values(mockPDFChunks).flat();
  const queryWords = query.toLowerCase().split(' ');
  
  // Score each chunk based on keyword overlap
  const scoredChunks = allChunks.map((chunk) => {
    const chunkLower = chunk.toLowerCase();
    const score = queryWords.reduce((acc, word) => {
      return acc + (chunkLower.includes(word) ? 1 : 0);
    }, 0);
    return { chunk, score };
  });

  // Sort by score and return top K
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk);
}

