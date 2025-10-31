/**
 * Script to ingest PDFs into ChromaDB
 * Run: node scripts/ingestPDFs.js
 */

const path = require('path');
const fs = require('fs');

// Polyfills for pdf-parse
global.DOMMatrix = class DOMMatrix {};
global.ImageData = class ImageData {};
global.Path2D = class Path2D {};

const pdf = require('pdf-parse');

async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    
    return {
      text: data.text,
      numPages: data.numpages,
    };
  } catch (error) {
    console.error(`Error extracting PDF from ${pdfPath}:`, error);
    throw error;
  }
}

function chunkText(text, chunkSize = 500, overlap = 50) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function extractQuestionsFromText(text) {
  const questions = [];
  const questionBlocks = text.split(/\n\s*\d+\.\s+/).filter(block => block.trim().length > 0);

  for (const block of questionBlocks) {
    const lines = block.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) continue;

    const question = lines[0].trim();
    const options = [];
    let answer = '';
    let explanation = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (/^[A-D][\.)]\s+/.test(line)) {
        options.push(line);
      } else if (line.toLowerCase().startsWith('answer:')) {
        answer = line.replace(/answer:/i, '').trim();
      } else if (line.toLowerCase().startsWith('explanation:')) {
        explanation = line.replace(/explanation:/i, '').trim();
      }
    }

    questions.push({
      question,
      options: options.length > 0 ? options : undefined,
      answer: answer || undefined,
      explanation: explanation || undefined,
    });
  }

  return questions;
}

async function ingestChapter1() {
  console.log('📚 Starting PDF ingestion...\n');

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

    // Delete existing collection if it exists (to fix embedding function issues)
    try {
      await client.deleteCollection({ name: COLLECTION_NAME });
      console.log('🗑️  Deleted old collection');
    } catch (error) {
      // Collection doesn't exist, that's fine
    }

    // Create new collection with no embedding function specified
    // ChromaDB server will use its default
    collection = await client.createCollection({
      name: COLLECTION_NAME,
      metadata: { 
        description: 'Educational content for CMA/CPA courses',
        'hnsw:space': 'cosine'
      },
    });
    console.log('✅ Created new ChromaDB collection:', COLLECTION_NAME);

    // Process Chapter 1 PDF
    const chapter1Path = path.join(process.cwd(), 'app', 'samples', 'Chapter 1.pdf');
    console.log('\n📖 Processing Chapter 1.pdf...');
    
    const chapter1Data = await extractTextFromPDF(chapter1Path);
    const chapter1Chunks = chunkText(chapter1Data.text, 500, 50);
    console.log(`   ✅ Extracted ${chapter1Chunks.length} chunks from Chapter 1`);

    // Add Chapter 1 to ChromaDB
    console.log('\n💾 Adding Chapter 1 to ChromaDB...');
    const chapter1Docs = chapter1Chunks;
    const chapter1Metadata = chapter1Chunks.map((chunk, idx) => ({
      source: 'Chapter 1',
      page: Math.floor((idx / chapter1Chunks.length) * chapter1Data.numPages) + 1,
      chunkIndex: idx,
      type: 'chapter_content',
    }));
    const chapter1Ids = chapter1Chunks.map((_, idx) => `chapter1_chunk_${idx}`);

    await collection.add({
      documents: chapter1Docs,
      metadatas: chapter1Metadata,
      ids: chapter1Ids,
    });
    console.log(`   ✅ Added ${chapter1Chunks.length} documents to ChromaDB`);

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

    await collection.add({
      documents: testbankDocs,
      metadatas: testbankMetadata,
      ids: testbankIds,
    });
    console.log(`   ✅ Added ${questions.length} documents to ChromaDB`);

    // Show final stats
    console.log('\n📊 Final Statistics:');
    const count = await collection.count();
    console.log(`   Collection: ${COLLECTION_NAME}`);
    console.log(`   Total documents: ${count}`);
    console.log(`   Status: connected`);

    console.log('\n✅ PDF ingestion complete!\n');
  } catch (error) {
    console.error('\n❌ Error during ingestion:', error.message);
    console.log('\n💡 Make sure ChromaDB is running:');
    console.log('   docker run -p 8000:8000 chromadb/chroma');
    process.exit(1);
  }
}

// Run ingestion
ingestChapter1();

