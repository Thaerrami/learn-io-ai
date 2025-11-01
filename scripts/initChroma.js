/**
 * Simple ChromaDB initialization script compatible with Node.js 14
 */

async function initChromaDB() {
  console.log('📚 Initializing ChromaDB...\n');

  try {
    // Dynamic import for ES modules
    const { ChromaClient } = await import('chromadb');
    
    // Initialize ChromaDB
    console.log('🔌 Connecting to ChromaDB...');
    const client = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000',
    });

    const COLLECTION_NAME = 'educational_content';
    let collection;

    // Delete existing collection if it exists
    try {
      await client.deleteCollection({ name: COLLECTION_NAME });
      console.log('🗑️  Deleted old collection');
    } catch (error) {
      // Collection doesn't exist, that's fine
    }

    // Create new collection
    collection = await client.createCollection({
      name: COLLECTION_NAME,
      metadata: { 
        description: 'Educational content for CMA/CPA courses'
      },
    });
    console.log('✅ Created new ChromaDB collection:', COLLECTION_NAME);

    // Add some sample data
    console.log('\n💾 Adding sample data...');
    const sampleDocs = [
      "Cost behavior refers to how costs change in response to changes in activity level.",
      "Fixed costs remain constant in total but vary per unit as activity changes.",
      "Variable costs remain constant per unit but vary in total with activity changes.",
      "Mixed costs contain both fixed and variable components.",
      "The relevant range is the range of activity within which cost behavior patterns are valid."
    ];
    
    const sampleMetadata = sampleDocs.map((doc, idx) => ({
      source: 'Sample Chapter 1',
      page: 1,
      chunkIndex: idx,
      type: 'chapter_content',
    }));
    
    const sampleIds = sampleDocs.map((_, idx) => `sample_chunk_${idx}`);
    await collection.add({
      documents: sampleDocs,
      metadatas: sampleMetadata,
      ids: sampleIds,
    });
    console.log(`   ✅ Added ${sampleDocs.length} sample documents to ChromaDB`);

    // Show final stats
    console.log('\n📊 Final Statistics:');
    const count = await collection.count();
    console.log(`   Collection: ${COLLECTION_NAME}`);
    console.log(`   Total documents: ${count}`);
    console.log(`   Status: connected`);

    console.log('\n✅ ChromaDB initialization complete!\n');
  } catch (error) {
    console.error('\n❌ Error during initialization:', error.message);
    console.log('\n💡 Make sure ChromaDB is running:');
    console.log('   docker run -p 8000:8000 chromadb/chroma:0.5.0');
    process.exit(1);
  }
}

// Run initialization
initChromaDB();
