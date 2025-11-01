/**
 * ChromaDB ingestion script - Node 14+ compatible
 * Run: node scripts/chromadb-ingest.js
 */

const fs = require('fs');
const path = require('path');

// Simple text chunking function
function chunkText(text, chunkSize = 500, overlap = 50) {
  if (!text || text.length === 0) return [];
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    if (currentChunk.length + trimmedSentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Add overlap from previous chunk
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 10));
      currentChunk = overlapWords.join(' ') + ' ' + trimmedSentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text]; // Fallback to original text
}

// Extract questions from text
function extractQuestionsFromText(text) {
  const questions = [];
  
  // Split by question numbers (1. 2. 3. etc.)
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
      options: options.length > 0 ? options : null,
      answer: answer || null,
      explanation: explanation || null,
    });
  }

  return questions;
}

async function processTextFile(filePath, sourceName) {
  try {
    console.log(`📄 Processing ${sourceName}...`);
    const text = fs.readFileSync(filePath, 'utf8');
    const chunks = chunkText(text, 500, 50);
    console.log(`   ✅ Created ${chunks.length} chunks from ${sourceName}`);
    
    return {
      text,
      chunks,
      numPages: Math.ceil(text.length / 2000) // Estimate pages
    };
  } catch (error) {
    console.error(`❌ Error processing ${sourceName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting ChromaDB ingestion...\n');

  try {
    // Dynamic import ChromaDB
    const { ChromaClient } = await import('chromadb');
    
    // Initialize ChromaDB with modern configuration
    console.log('🔌 Connecting to ChromaDB...');
    const chromaHost = process.env.CHROMA_HOST || 'localhost';
    const chromaPort = parseInt(process.env.CHROMA_PORT || '8000');
    
    const client = new ChromaClient({
      host: chromaHost,
      port: chromaPort,
      ssl: false
    });

    const COLLECTION_NAME = 'educational_content';
    let collection;

    // Delete existing collection if it exists (for fresh start)
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
    console.log('✅ Created ChromaDB collection:', COLLECTION_NAME);
    
    // Check for sample text files
    const samplesDir = path.join(process.cwd(), 'app', 'samples');
    const textFiles = [];
    
    if (fs.existsSync(samplesDir)) {
      const files = fs.readdirSync(samplesDir);
      for (const file of files) {
        if (file.endsWith('.txt')) {
          textFiles.push(path.join(samplesDir, file));
        }
      }
    }

    if (textFiles.length === 0) {
      console.log('⚠️  No .txt files found in app/samples/');
      console.log('💡 Run: npm run convert-help');
      console.log('   to learn how to convert PDFs to text files');
      return;
    }

    console.log(`\n📁 Found ${textFiles.length} text files to process\n`);

    // Process each text file
    for (const filePath of textFiles) {
      const fileName = path.basename(filePath);
      
      if (fileName.includes('chapter') || fileName.includes('content')) {
        // Process as chapter content
        const data = await processTextFile(filePath, fileName);
        
        const documents = data.chunks;
        const metadatas = data.chunks.map((chunk, idx) => ({
          source: fileName,
          page: Math.floor((idx / data.chunks.length) * data.numPages) + 1,
          chunkIndex: idx,
          type: 'chapter_content',
        }));
        const ids = data.chunks.map((_, idx) => `${fileName}_chunk_${idx}`);


        console.log("Sample add payload:", {
      ids: ids.slice(0, 2),
      documents: documents.slice(0, 2),
      metadatas: metadatas.slice(0, 2),
      embeddings_shape: documents
    });

        await collection.add({ documents, metadatas, ids });
        console.log(`   ✅ Added ${documents.length} chunks to ChromaDB`);
        
      } else if (fileName.includes('testbank') || fileName.includes('question')) {
        // Process as questions
        const data = await processTextFile(filePath, fileName);
        const questions = extractQuestionsFromText(data.text);
        
        console.log(`   📝 Extracted ${questions.length} questions from ${fileName}`);
        
        const documents = questions.map(q => 
          `Question: ${q.question}\n${q.options ? q.options.join('\n') : ''}\nAnswer: ${q.answer || 'N/A'}\nExplanation: ${q.explanation || 'N/A'}`
        );
        const metadatas = questions.map((q, idx) => ({
          source: fileName,
          type: 'testbank_question',
          question_index: idx,
          has_options: !!q.options,
          has_answer: !!q.answer,
          has_explanation: !!q.explanation,
        }));
        const ids = questions.map((_, idx) => `${fileName}_q_${idx}`);
        
        await collection.add({ documents, metadatas, ids });
        console.log(`   ✅ Added ${questions.length} questions to ChromaDB`);
      }
    }

    // Show final stats
    const totalCount = await collection.count();
    console.log('\n📊 Ingestion Complete!');
    console.log(`   Collection: ${COLLECTION_NAME}`);
    console.log(`   Total documents: ${totalCount}`);
    console.log(`   ChromaDB URL: http://${chromaHost}:${chromaPort}`);
    console.log(`   Status: ✅ Success`);
    
    console.log('\n🎉 Your ChromaDB is ready!');
    console.log('   Start the web app: npm run dev');
    console.log('   View at: http://localhost:3000');
    
  } catch (error) {
    console.error('\n❌ Error during ingestion:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 ChromaDB connection failed. Try:');
      console.log('   npm run docker:start    # Start ChromaDB');
      console.log('   npm run docker:status   # Check status');
    } else if (error.message.includes('Cannot resolve module')) {
      console.log('\n💡 ChromaDB module not found. Install with:');
      console.log('   npm install chromadb');
    } else {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Check ChromaDB is running: npm run docker:status');
      console.log('   2. Verify text files exist: npm run convert-help');
      console.log('   3. Check file permissions');
    }
    process.exit(1);
  }
}

// Run the ingestion
if (require.main === module) {
  main();
}

module.exports = { chunkText, extractQuestionsFromText, processTextFile };
