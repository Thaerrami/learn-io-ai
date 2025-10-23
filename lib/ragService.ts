import { mockPDFChunks } from './mockData';
import { RAGSearchResult } from './types';
import { searchKeywordDefinition, healthCheck } from './chromaService';

/**
 * RAG Search Function with ChromaDB
 * Uses vector database for semantic search with fallback to mock data
 */
export async function RAG_Search_Function(keyword: string): Promise<RAGSearchResult> {
  try {
    // Try ChromaDB first if available
    const isChromaHealthy = await healthCheck();
    
    if (isChromaHealthy) {
      console.log(`🔍 Searching ChromaDB for: ${keyword}`);
      const result = await searchKeywordDefinition(keyword);
      
      return {
        keyword,
        relevant_chunks: result.relevant_chunks,
        source_page: result.source_page,
        source: 'chromadb',
      };
    }
  } catch (error) {
    console.log(`⚠️ ChromaDB unavailable, falling back to mock data for: ${keyword}`);
  }

  // Fallback to mock data
  return RAG_Search_Function_Mock(keyword);
}

/**
 * Mock RAG Search Function (Fallback)
 * Uses simple keyword matching against mock PDF chunks
 */
function RAG_Search_Function_Mock(keyword: string): RAGSearchResult {
  const normalizedKeyword = keyword.toLowerCase().trim();
  
  // Try exact match first
  if (mockPDFChunks[normalizedKeyword]) {
    return {
      keyword,
      relevant_chunks: mockPDFChunks[normalizedKeyword],
      source_page: Math.floor(Math.random() * 50) + 1,
      source: 'mock',
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
      source: 'mock',
    };
  }

  // If no match found, return a generic response
  return {
    keyword,
    relevant_chunks: [
      `Definition for "${keyword}" is not available in the current knowledge base. This term may require additional reference materials or expert consultation.`,
    ],
    source_page: undefined,
    source: 'not_found',
  };
}

/**
 * Batch RAG search for multiple keywords
 */
export async function batchRAGSearch(keywords: string[]): Promise<Record<string, RAGSearchResult>> {
  const results: Record<string, RAGSearchResult> = {};
  
  // Search in parallel for better performance
  const searches = keywords.map(async (keyword) => {
    const result = await RAG_Search_Function(keyword);
    results[keyword] = result;
  });
  
  await Promise.all(searches);
  
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

