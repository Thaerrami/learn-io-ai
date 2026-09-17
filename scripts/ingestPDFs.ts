/**
 * Script to ingest PDFs into ChromaDB
 * Run: npx tsx scripts/ingestPDFs.ts
 */

const path = require('path');

async function ingestChapter1() {
  console.log('📚 Starting PDF ingestion...\n');

  try {
    // Import services
    const { processPDF, extractTextFromPDF, extractQuestionsFromText } = require('../lib/pdfService');
    const { initChromaDB, addDocuments, getCollectionStats } = require('../lib/chromaService');

    // Initialize ChromaDB (create collection if it doesn't exist)
    console.log('🔌 Connecting to ChromaDB...');
    await initChromaDB(true);

    // Process Chapter 1 PDF
    const chapter1Path = path.join(process.cwd(), 'app', 'samples', 'Chapter 1.pdf');
    console.log('\n📖 Processing Chapter 1.pdf...');
    
    const chapter1Chunks = await processPDF(chapter1Path, 'Chapter 1');
    console.log(`   ✅ Extracted ${chapter1Chunks.length} chunks from Chapter 1`);

    // Add Chapter 1 to ChromaDB
    console.log('\n💾 Adding Chapter 1 to ChromaDB...');
    const chapter1Docs = chapter1Chunks.map(chunk => chunk.text);
    const chapter1Metadata = chapter1Chunks.map(chunk => ({
      source: chunk.source,
      page: chunk.page,
      chunkIndex: chunk.chunkIndex,
      type: 'chapter_content',
    }));
    const chapter1Ids = chapter1Chunks.map((_, idx) => `chapter1_chunk_${idx}`);

    await addDocuments(chapter1Docs, chapter1Metadata, chapter1Ids);

    // Process Testbank PDF
    const testbankPath = path.join(process.cwd(), 'app', 'samples', 'Testbank Chapter (1).pdf');
    console.log('\n📝 Processing Testbank Chapter (1).pdf...');
    
    const testbankData = await extractTextFromPDF(testbankPath);
    const questions = extractQuestionsFromText(testbankData.text);
    console.log(`   ✅ Extracted ${questions.length} questions from Testbank`);

    // Add Testbank questions to ChromaDB
    console.log('\n💾 Adding Testbank questions to ChromaDB...');
    const testbankDocs = questions.map(q => 
      `Question: ${q.question}\n${q.options?.join('\n') || ''}\nAnswer: ${q.answer || 'N/A'}\nExplanation: ${q.explanation || 'N/A'}`
    );
    const testbankMetadata = questions.map((q, idx) => ({
      source: 'Testbank Chapter (1)',
      type: 'testbank_question',
      question_index: idx,
      has_options: !!q.options,
      has_answer: !!q.answer,
      has_explanation: !!q.explanation,
    }));
    const testbankIds = questions.map((_, idx) => `testbank_q_${idx}`);

    await addDocuments(testbankDocs, testbankMetadata, testbankIds);

    // Show final stats
    console.log('\n📊 Final Statistics:');
    const stats = await getCollectionStats();
    console.log(`   Collection: ${stats.collection_name}`);
    console.log(`   Total documents: ${stats.document_count}`);
    console.log(`   Status: ${stats.status}`);

    console.log('\n✅ PDF ingestion complete!\n');
  } catch (error) {
    console.error('\n❌ Error during ingestion:', error);
    console.log('\n💡 Make sure ChromaDB is running:');
    console.log('   docker run -p 8000:8000 chromadb/chroma');
    process.exit(1);
  }
}

// Run ingestion
ingestChapter1();

