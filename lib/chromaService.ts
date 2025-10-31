/**
 * ChromaDB Service for RAG (Retrieval-Augmented Generation)
 * 
 * This service provides vector-based semantic search for educational content.
 * It stores PDF chunks, definitions, and course materials in a vector database
 * for efficient retrieval.
 * 
 * NOTE: This module should only be imported in server-side code (API routes)
 */

import type { ChromaClient, Collection } from 'chromadb';

// Initialize ChromaDB client
let client: ChromaClient | null = null;
let collection: Collection | null = null;

const COLLECTION_NAME = 'educational_content';

/**
 * Lazy load ChromaDB client (only on server side)
 */
async function getChromaClient(): Promise<ChromaClient> {
  if (client) return client;
  
  const { ChromaClient } = await import('chromadb');
  client = new ChromaClient({
    path: process.env.CHROMA_URL || 'http://localhost:8000',
  });
  
  return client;
}

/**
 * Initialize ChromaDB connection
 */
export async function initChromaDB() {
  try {
    // Lazy load ChromaDB client
    const chromaClient = await getChromaClient();

    // Get existing collection
    // Note: Collection must be created by running the ingestion script first
    try {
      collection = await chromaClient.getCollection({ 
        name: COLLECTION_NAME,
      });
      console.log('✅ Connected to existing ChromaDB collection:', COLLECTION_NAME);
    } catch (error) {
      // Collection doesn't exist - user needs to run ingestion
      console.warn('⚠️ Collection not found. Please run: npm run chroma:ingest');
      throw new Error('ChromaDB collection not initialized. Run: npm run chroma:ingest');
    }

    return collection;
  } catch (error) {
    console.error('❌ Failed to initialize ChromaDB:', error);
    console.log('💡 Make sure ChromaDB is running: docker run -p 8000:8000 chromadb/chroma');
    throw error;
  }
}

/**
 * Add documents to ChromaDB
 */
export async function addDocuments(
  documents: string[],
  metadatas: Record<string, any>[],
  ids: string[]
) {
  try {
    if (!collection) {
      await initChromaDB();
    }

    await collection.add({
      documents,
      metadatas,
      ids,
    });

    console.log(`✅ Added ${documents.length} documents to ChromaDB`);
  } catch (error) {
    console.error('❌ Failed to add documents:', error);
    throw error;
  }
}

/**
 * Search for similar documents using semantic search
 */
export async function semanticSearch(
  query: string,
  nResults: number = 3
): Promise<{
  documents: string[][];
  metadatas: Record<string, any>[][];
  distances: number[][];
}> {
  try {
    if (!collection) {
      await initChromaDB();
    }

    const results = await collection.query({
      queryTexts: [query],
      nResults,
    });

    return {
      documents: results.documents,
      metadatas: results.metadatas,
      distances: results.distances || [],
    };
  } catch (error) {
    console.error('❌ Semantic search failed:', error);
    throw error;
  }
}

/**
 * Search for keyword definitions
 */
export async function searchKeywordDefinition(keyword: string) {
  try {
    const results = await semanticSearch(keyword, 3);

    if (!results.documents[0] || results.documents[0].length === 0) {
      return {
        keyword,
        relevant_chunks: [
          `Definition for "${keyword}" is not available in the current knowledge base.`,
        ],
        source_page: undefined,
      };
    }

    return {
      keyword,
      relevant_chunks: results.documents[0],
      metadatas: results.metadatas[0],
      distances: results.distances[0],
      source_page: results.metadatas[0]?.[0]?.page || undefined,
    };
  } catch (error) {
    console.error('❌ Keyword search failed:', error);
    // Fallback to empty result
    return {
      keyword,
      relevant_chunks: [`Error retrieving definition for "${keyword}".`],
      source_page: undefined,
    };
  }
}

/**
 * Batch search for multiple keywords
 */
export async function batchKeywordSearch(keywords: string[]) {
  const results: Record<string, any> = {};

  for (const keyword of keywords) {
    results[keyword] = await searchKeywordDefinition(keyword);
  }

  return results;
}

/**
 * Get collection statistics
 */
export async function getCollectionStats() {
  try {
    if (!collection) {
      await initChromaDB();
    }

    const count = await collection.count();

    return {
      collection_name: COLLECTION_NAME,
      document_count: count,
      status: 'connected',
    };
  } catch (error) {
    return {
      collection_name: COLLECTION_NAME,
      document_count: 0,
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete all documents from collection (use with caution!)
 */
export async function clearCollection() {
  try {
    if (!collection) {
      await initChromaDB();
    }

    const chromaClient = await getChromaClient();
    await chromaClient.deleteCollection({ name: COLLECTION_NAME });
    console.log('✅ Cleared ChromaDB collection');

    // Recreate empty collection
    collection = await chromaClient.createCollection({
      name: COLLECTION_NAME,
      metadata: {
        description: 'Educational content for CMA/CPA courses',
      },
    });
  } catch (error) {
    console.error('❌ Failed to clear collection:', error);
    throw error;
  }
}

/**
 * Health check for ChromaDB connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const chromaClient = await getChromaClient();
    await chromaClient.heartbeat();
    return true;
  } catch (error) {
    return false;
  }
}

