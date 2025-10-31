/**
 * RAG Service using ChromaDB
 * Provides semantic search with source attribution
 */

import { semanticSearch, searchKeywordDefinition, batchKeywordSearch, initChromaDB } from './chromaService';
import { RAGSearchResult } from './types';

/**
 * Initialize RAG system
 */
export async function initRAG() {
  try {
    await initChromaDB();
    return true;
  } catch (error) {
    console.error('Failed to initialize RAG:', error);
    return false;
  }
}

/**
 * Search for relevant content using semantic search
 */
export async function searchContent(
  query: string,
  nResults: number = 3
): Promise<Array<{
  text: string;
  source: string;
  page?: number;
  score: number;
}>> {
  try {
    const results = await semanticSearch(query, nResults);
    
    if (!results.documents[0] || results.documents[0].length === 0) {
      return [];
    }

    return results.documents[0].map((doc, idx) => ({
      text: doc,
      source: results.metadatas[0]?.[idx]?.source || 'Unknown',
      page: results.metadatas[0]?.[idx]?.page,
      score: results.distances[0]?.[idx] || 0,
    }));
  } catch (error) {
    console.error('Search content failed:', error);
    return [];
  }
}

/**
 * RAG Search Function for keywords
 */
export async function RAG_Search_Function(keyword: string): Promise<RAGSearchResult> {
  try {
    const result = await searchKeywordDefinition(keyword);
    return {
      keyword: result.keyword,
      relevant_chunks: result.relevant_chunks,
      source_page: result.source_page,
      metadatas: result.metadatas,
    };
  } catch (error) {
    console.error(`RAG search failed for keyword "${keyword}":`, error);
    return {
      keyword,
      relevant_chunks: [`Error retrieving information for "${keyword}".`],
      source_page: undefined,
    };
  }
}

/**
 * Batch RAG search for multiple keywords
 */
export async function batchRAGSearch(keywords: string[]): Promise<Record<string, RAGSearchResult>> {
  try {
    return await batchKeywordSearch(keywords);
  } catch (error) {
    console.error('Batch RAG search failed:', error);
    const fallback: Record<string, RAGSearchResult> = {};
    for (const keyword of keywords) {
      fallback[keyword] = {
        keyword,
        relevant_chunks: [`Error retrieving information for "${keyword}".`],
        source_page: undefined,
      };
    }
    return fallback;
  }
}

/**
 * Get context for chapter summary generation
 */
export async function getChapterContext(
  chapterName: string,
  keywords: string[]
): Promise<Array<{
  text: string;
  source: string;
  page?: number;
}>> {
  try {
    // Search for chapter content
    const chapterQuery = `${chapterName} overview introduction main topics`;
    const chapterResults = await searchContent(chapterQuery, 5);
    
    // Search for specific keywords
    const keywordResults = await Promise.all(
      keywords.map(keyword => searchContent(keyword, 2))
    );
    
    // Combine and deduplicate
    const allResults = [...chapterResults, ...keywordResults.flat()];
    const uniqueResults = allResults.filter(
      (result, index, self) =>
        index === self.findIndex(r => r.text === result.text)
    );
    
    return uniqueResults.slice(0, 10); // Return top 10 most relevant
  } catch (error) {
    console.error('Failed to get chapter context:', error);
    return [];
  }
}

/**
 * Get example questions from testbank
 */
export async function getTestbankExamples(
  topic: string,
  count: number = 3
): Promise<Array<{
  text: string;
  source: string;
}>> {
  try {
    const results = await semanticSearch(`${topic} question`, count);
    
    if (!results.documents[0] || results.documents[0].length === 0) {
      return [];
    }

    return results.documents[0]
      .map((doc, idx) => ({
        text: doc,
        source: results.metadatas[0]?.[idx]?.source || 'Testbank',
        type: results.metadatas[0]?.[idx]?.type,
      }))
      .filter(result => result.type === 'testbank_question');
  } catch (error) {
    console.error('Failed to get testbank examples:', error);
    return [];
  }
}
