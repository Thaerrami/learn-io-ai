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
  
  // Use the modern ChromaDB client configuration
  const chromaHost = process.env.CHROMA_HOST || 'localhost';
  const chromaPort = parseInt(process.env.CHROMA_PORT || '8000');
  
  client = new ChromaClient({
    host: chromaHost,
    port: chromaPort,
    ssl: false
  });
  
  return client;
}

/**
 * Initialize ChromaDB connection
 * @param createIfNotExists - If true, creates the collection if it doesn't exist (for ingestion scripts)
 */
export async function initChromaDB(createIfNotExists: boolean = false) {
  try {
    // Lazy load ChromaDB client
    const chromaClient = await getChromaClient();

    // Get existing collection with embedding function
    try {
      // Dynamic import to avoid webpack bundling issues
      const defaultEmbedModule = await import('@chroma-core/default-embed');
      const DefaultEmbeddingFunction = (defaultEmbedModule as any).DefaultEmbeddingFunction || (defaultEmbedModule as any).default;
      const embedder = new DefaultEmbeddingFunction();
      
      collection = await chromaClient.getCollection({ 
        name: COLLECTION_NAME,
        embeddingFunction: embedder,
      });
      console.log('✅ Connected to existing ChromaDB collection:', COLLECTION_NAME);
      return collection;
    } catch (error) {
      // Collection doesn't exist
      if (createIfNotExists) {
        // Create the collection for ingestion with default embedding function
        console.log('📝 Creating new ChromaDB collection:', COLLECTION_NAME);
        // Dynamic import to avoid webpack bundling issues
        const defaultEmbedModule = await import('@chroma-core/default-embed');
        const DefaultEmbeddingFunction = (defaultEmbedModule as any).DefaultEmbeddingFunction || (defaultEmbedModule as any).default;
        const embedder = new DefaultEmbeddingFunction();
        
        collection = await chromaClient.createCollection({
          name: COLLECTION_NAME,
          embeddingFunction: embedder,
          metadata: {
            description: 'Educational content for CMA/CPA courses',
          },
        });
        console.log('✅ Created ChromaDB collection:', COLLECTION_NAME);
        return collection;
      } else {
        // Gracefully handle without throwing (for runtime use)
        console.warn('⚠️ Collection not found. Running without ChromaDB. To enable RAG features, run: npm run chroma:ingest');
        collection = null;
        return null;
      }
    }
  } catch (error) {
    // ChromaDB not available - gracefully handle without throwing
    console.warn('⚠️ ChromaDB not available. Running without RAG features.');
    console.log('💡 To enable ChromaDB: docker run -p 8000:8000 chromadb/chroma');
    collection = null;
    return null;
  }
}

/**
 * Add documents to ChromaDB
 * Batches large additions to avoid server errors
 */
export async function addDocuments(
  documents: string[],
  metadatas: Record<string, any>[],
  ids: string[]
) {
  try {
    if (!collection) {
      await initChromaDB(true);
    }

    // If collection is still null after init, return gracefully
    if (!collection) {
      console.warn('⚠️ Cannot add documents: ChromaDB not available');
      return;
    }

    // Batch additions to avoid server errors (max 10 at a time with delay)
    const batchSize = 10;
    let added = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batchDocs = documents.slice(i, i + batchSize);
      const batchMetas = metadatas.slice(i, i + batchSize);
      const batchIds = ids.slice(i, i + batchSize);

      try {
        await collection.add({
          documents: batchDocs,
          metadatas: batchMetas,
          ids: batchIds,
        });
        added += batchDocs.length;
        // Small delay between batches to avoid overwhelming the server
        if (i + batchSize < documents.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn(`⚠️ Failed to add batch ${Math.floor(i / batchSize) + 1}:`, error instanceof Error ? error.message : 'Unknown error');
        // Try individual documents in this batch
        for (let j = 0; j < batchDocs.length; j++) {
          try {
            await collection.add({
              documents: [batchDocs[j]],
              metadatas: [batchMetas[j]],
              ids: [batchIds[j]],
            });
            added++;
          } catch (individualError) {
            console.warn(`⚠️ Failed to add document ${i + j}:`, individualError instanceof Error ? individualError.message : 'Unknown error');
          }
        }
      }
    }

    if (added > 0) {
      console.log(`✅ Added ${added} documents to ChromaDB`);
    }
  } catch (error) {
    console.warn('⚠️ Failed to add documents:', error instanceof Error ? error.message : 'Unknown error');
    // Don't throw - allow app to continue without ChromaDB
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

    // If collection is still null after init, return empty results
    if (!collection) {
      return {
        documents: [[]],
        metadatas: [[]],
        distances: [[]],
      };
    }

    const results = await collection.query({
      queryTexts: [query],
      nResults,
    });

    // Filter out null values and ensure proper types
    const documents = (results.documents || [[]]).map(docArray => 
      (docArray || []).filter((doc): doc is string => doc !== null && doc !== undefined)
    );
    const metadatas = (results.metadatas || [[]]).map(metaArray => 
      (metaArray || []).filter((meta): meta is Record<string, any> => meta !== null && meta !== undefined)
    );
    const distances = (results.distances || [[]]).map(distArray => 
      (distArray || []).filter((dist): dist is number => dist !== null && dist !== undefined)
    );

    return {
      documents: documents.length > 0 ? documents : [[]],
      metadatas: metadatas.length > 0 ? metadatas : [[]],
      distances: distances.length > 0 ? distances : [[]],
    };
  } catch (error) {
    // Gracefully return empty results instead of throwing
    console.warn('⚠️ Semantic search failed, returning empty results:', error instanceof Error ? error.message : 'Unknown error');
    return {
      documents: [[]],
      metadatas: [[]],
      distances: [[]],
    };
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

    if (!collection) {
      return {
        collection_name: COLLECTION_NAME,
        document_count: 0,
        status: 'disconnected',
        error: 'ChromaDB not available',
      };
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

