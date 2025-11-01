/**
 * Simple PDF ingestion script compatible with Node 14
 * Run: node scripts/simple-ingest.js
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

// Mock ChromaDB functions for testing
const mockChromaDB = {
  collections: new Map(),
  
  async createCollection(name) {
    console.log(`📦 Creating collection: ${name}`);
    this.collections.set(name, { documents: [], metadata: [], ids: [] });
    return {
      add: async ({ documents, metadatas, ids }) => {
        const collection = this.collections.get(name);
        collection.documents.push(...documents);
        collection.metadata.push(...metadatas);
        collection.ids.push(...ids);
        console.log(`✅ Added ${documents.length} documents to ${name}`);
      },
      count: async () => {
        const collection = this.collections.get(name);
        return collection.documents.length;
      }
    };
  }
};

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
  console.log('🚀 Starting simplified PDF ingestion...\n');
  console.log('📝 Note: This version processes text files due to Node 14 compatibility\n');

  try {
    // Create collection
    const collection = await mockChromaDB.createCollection('educational_content');
    
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
      // Create sample text files for demonstration
      console.log('📝 No text files found. Creating sample content...\n');
      
      const sampleChapterContent = `
Chapter 1: Introduction to Financial Accounting

Financial accounting is the process of recording, summarizing, and reporting financial transactions of a business. It provides information to external users such as investors, creditors, and regulatory agencies.

Key Concepts:
1. Assets: Resources owned by the business that have economic value
2. Liabilities: Debts or obligations owed by the business
3. Equity: The owner's claim on business assets

The Accounting Equation:
Assets = Liabilities + Owner's Equity

This fundamental equation must always balance and forms the basis of double-entry bookkeeping.

Financial Statements:
- Balance Sheet: Shows financial position at a specific date
- Income Statement: Reports revenues and expenses over a period
- Cash Flow Statement: Shows cash inflows and outflows
- Statement of Owner's Equity: Shows changes in equity

Generally Accepted Accounting Principles (GAAP) provide the framework for financial reporting in the United States.
      `.trim();

      const sampleQuestions = `
1. What is the fundamental accounting equation?
A) Assets + Liabilities = Equity
B) Assets = Liabilities + Equity
C) Assets = Liabilities - Equity
D) Assets - Liabilities = Revenue
Answer: B
Explanation: The accounting equation shows that assets equal the sum of liabilities and owner's equity.

2. Which financial statement shows the company's financial position at a specific date?
A) Income Statement
B) Cash Flow Statement
C) Balance Sheet
D) Statement of Equity
Answer: C
Explanation: The balance sheet provides a snapshot of financial position at a specific point in time.

3. What are assets?
A) Debts owed by the business
B) Owner's claims on the business
C) Resources owned by the business
D) Business expenses
Answer: C
Explanation: Assets are economic resources owned or controlled by the business that provide future benefits.
      `.trim();

      // Create sample files
      if (!fs.existsSync(samplesDir)) {
        fs.mkdirSync(samplesDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(samplesDir, 'chapter1.txt'), sampleChapterContent);
      fs.writeFileSync(path.join(samplesDir, 'testbank.txt'), sampleQuestions);
      
      textFiles.push(path.join(samplesDir, 'chapter1.txt'));
      textFiles.push(path.join(samplesDir, 'testbank.txt'));
      
      console.log('✅ Created sample files: chapter1.txt and testbank.txt\n');
    }

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

        await collection.add({ documents, metadatas, ids });
        
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
      }
    }

    // Show final stats
    const totalCount = await collection.count();
    console.log('\n📊 Ingestion Complete!');
    console.log(`   Collection: educational_content`);
    console.log(`   Total documents: ${totalCount}`);
    console.log(`   Status: ✅ Success`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Install a newer version of Node.js (18+ recommended)');
    console.log('2. Convert your PDF files to text files for now');
    console.log('3. Place text files in the app/samples/ directory');
    console.log('4. Run this script again to process new files');
    
  } catch (error) {
    console.error('\n❌ Error during ingestion:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check that the app/samples directory exists');
    console.log('2. Ensure text files are properly formatted');
    console.log('3. Verify file permissions');
    process.exit(1);
  }
}

// Run the ingestion
if (require.main === module) {
  main();
}

module.exports = { chunkText, extractQuestionsFromText, processTextFile };
