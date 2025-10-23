# PDF to ChromaDB: Complete Data Insertion Guide

## 📚 Understanding ChromaDB Data Types

### Required Fields for ChromaDB:

```typescript
interface ChromaDBDocument {
  documents: string[];     // The actual text content (REQUIRED)
  metadatas: object[];     // Metadata for each document (OPTIONAL but recommended)
  ids: string[];          // Unique identifiers (REQUIRED)
}
```

### Data Type Details:

1. **`documents`** (string[])
   - The actual text content you want to search
   - Each string is one "chunk" of content
   - Recommended size: 200-1000 tokens (~150-750 words)
   - Must be plain text (no formatting)

2. **`metadatas`** (object[])
   - Any JSON-serializable metadata
   - Common fields: `source`, `page`, `chapter`, `topic`, `author`
   - Helps with filtering and context

3. **`ids`** (string[])
   - Unique identifier for each document
   - Must be unique across the collection
   - Format: "doc-1", "pdf-page-5", "chapter-3-section-2"

---

## 🔧 Method 1: Insert Simple Text Data (What You Have Now)

### Current Implementation:

```typescript
// scripts/populateChromaDB.ts

const educationalContent = [
  {
    id: 'unique-id-1',                    // ✅ Unique identifier
    content: 'Your text content here...', // ✅ The actual text
    metadata: {                            // ✅ Additional info
      topic: 'Financial Analysis',
      category: 'Accounting',
      keywords: ['keyword1', 'keyword2'],
      page: 45,
      source: 'CMA Study Guide',
    },
  },
  // More documents...
];

// Insert into ChromaDB
await addDocuments(
  documents: educationalContent.map(item => item.content),
  metadatas: educationalContent.map(item => item.metadata),
  ids: educationalContent.map(item => item.id)
);
```

**This works for**:
- ✅ Manually curated content
- ✅ Small datasets (<100 documents)
- ✅ Pre-formatted text

---

## 📄 Method 2: Extract & Insert PDF Data

### Step 1: Install PDF Processing Library

```bash
npm install pdf-parse
npm install --save-dev @types/pdf-parse
```

### Step 2: Create PDF Processing Script

Create `scripts/processPDF.ts`:

```typescript
import fs from 'fs';
import pdf from 'pdf-parse';
import { addDocuments, initChromaDB } from '../lib/chromaService';

interface PDFChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    page: number;
    chapter?: string;
    total_pages: number;
  };
}

/**
 * Extract text from PDF file
 */
async function extractPDFText(pdfPath: string): Promise<{
  text: string;
  numPages: number;
  info: any;
}> {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  
  return {
    text: data.text,
    numPages: data.numpages,
    info: data.info,
  };
}

/**
 * Extract text from PDF page by page
 */
async function extractPDFByPage(pdfPath: string): Promise<{
  pages: string[];
  numPages: number;
}> {
  const dataBuffer = fs.readFileSync(pdfPath);
  
  const data = await pdf(dataBuffer, {
    // Option to get page-by-page text
    pagerender: (pageData) => {
      return pageData.getTextContent().then((textContent) => {
        return textContent.items
          .map((item: any) => item.str)
          .join(' ');
      });
    }
  });
  
  // Note: pdf-parse doesn't support page-by-page extraction directly
  // For proper page-by-page, use pdf2json or pdfjs-dist
  return {
    pages: [data.text], // Simplified - see advanced method below
    numPages: data.numpages,
  };
}

/**
 * Chunk text into smaller pieces
 * This is important for better search results
 */
function chunkText(
  text: string, 
  chunkSize: number = 1000, 
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  const words = text.split(' ');
  
  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }
  
  return chunks;
}

/**
 * Process PDF and prepare for ChromaDB
 */
async function processPDF(
  pdfPath: string,
  sourceName: string,
  chunkSize: number = 1000
): Promise<PDFChunk[]> {
  console.log(`📄 Processing PDF: ${pdfPath}`);
  
  // Extract text
  const { text, numPages, info } = await extractPDFText(pdfPath);
  
  console.log(`📊 Extracted ${text.length} characters from ${numPages} pages`);
  
  // Clean text (remove extra whitespace, normalize)
  const cleanedText = text
    .replace(/\s+/g, ' ')          // Multiple spaces to single space
    .replace(/\n+/g, '\n')         // Multiple newlines to single
    .trim();
  
  // Split into chunks
  const chunks = chunkText(cleanedText, chunkSize);
  
  console.log(`✂️  Created ${chunks.length} chunks`);
  
  // Create PDFChunk objects
  const pdfChunks: PDFChunk[] = chunks.map((chunk, index) => ({
    id: `${sourceName.toLowerCase().replace(/\s+/g, '-')}-chunk-${index}`,
    content: chunk,
    metadata: {
      source: sourceName,
      page: Math.floor(index * chunkSize / (text.length / numPages)),
      chapter: extractChapter(chunk), // Optional
      total_pages: numPages,
      chunk_index: index,
    },
  }));
  
  return pdfChunks;
}

/**
 * Optional: Extract chapter from text
 */
function extractChapter(text: string): string | undefined {
  // Look for chapter patterns
  const chapterMatch = text.match(/chapter\s+(\d+)/i);
  return chapterMatch ? `Chapter ${chapterMatch[1]}` : undefined;
}

/**
 * Main function to process and insert PDF
 */
async function main() {
  try {
    const pdfPath = './documents/cma-study-guide.pdf'; // Your PDF path
    const sourceName = 'CMA Study Guide - Part 1';
    
    // Initialize ChromaDB
    await initChromaDB();
    
    // Process PDF
    const chunks = await processPDF(pdfPath, sourceName);
    
    // Insert into ChromaDB
    console.log('💾 Inserting into ChromaDB...');
    await addDocuments(
      chunks.map(c => c.content),
      chunks.map(c => c.metadata),
      chunks.map(c => c.id)
    );
    
    console.log(`✅ Successfully inserted ${chunks.length} chunks!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
```

### Step 3: Run the Script

```bash
# Make sure ChromaDB is running
docker-compose up -d

# Process your PDF
npx tsx scripts/processPDF.ts
```

---

## 📋 Method 3: Advanced PDF Processing (Page-by-Page)

For better page-by-page extraction, use `pdfjs-dist`:

### Install:

```bash
npm install pdfjs-dist
```

### Create Advanced PDF Processor:

Create `scripts/advancedPDFProcessor.ts`:

```typescript
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
import fs from 'fs';
import { addDocuments, initChromaDB } from '../lib/chromaService';

// Required for pdfjs to work in Node.js
const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.entry');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PageContent {
  pageNumber: number;
  text: string;
}

/**
 * Extract text from each page of PDF
 */
async function extractPDFPages(pdfPath: string): Promise<PageContent[]> {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjs.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  const pages: PageContent[] = [];
  
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    pages.push({
      pageNumber: pageNum,
      text: text.trim(),
    });
    
    console.log(`✓ Processed page ${pageNum}/${pdfDocument.numPages}`);
  }
  
  return pages;
}

/**
 * Process PDF page by page
 */
async function processPDFByPage(
  pdfPath: string,
  sourceName: string
): Promise<{
  documents: string[];
  metadatas: any[];
  ids: string[];
}> {
  console.log(`📄 Processing PDF: ${pdfPath}`);
  
  const pages = await extractPDFPages(pdfPath);
  
  const documents: string[] = [];
  const metadatas: any[] = [];
  const ids: string[] = [];
  
  pages.forEach((page) => {
    // Skip empty pages
    if (page.text.length < 50) return;
    
    // For long pages, chunk them
    if (page.text.length > 2000) {
      const chunks = chunkText(page.text, 1000, 200);
      chunks.forEach((chunk, index) => {
        documents.push(chunk);
        metadatas.push({
          source: sourceName,
          page: page.pageNumber,
          chunk_index: index,
          is_chunked: true,
        });
        ids.push(`${sourceName}-page-${page.pageNumber}-chunk-${index}`);
      });
    } else {
      // Small page, insert as-is
      documents.push(page.text);
      metadatas.push({
        source: sourceName,
        page: page.pageNumber,
        is_chunked: false,
      });
      ids.push(`${sourceName}-page-${page.pageNumber}`);
    }
  });
  
  return { documents, metadatas, ids };
}

/**
 * Chunk text helper
 */
function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk: string[] = [];
  let currentLength = 0;
  
  for (const sentence of sentences) {
    const words = sentence.split(' ');
    
    if (currentLength + words.length > size && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      // Keep overlap
      currentChunk = currentChunk.slice(-overlap);
      currentLength = currentChunk.length;
    }
    
    currentChunk.push(...words);
    currentLength += words.length;
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  
  return chunks;
}

/**
 * Main execution
 */
async function main() {
  try {
    const pdfPath = './documents/cma-study-guide.pdf';
    const sourceName = 'CMA-Study-Guide';
    
    // Initialize ChromaDB
    await initChromaDB();
    
    // Process PDF
    const { documents, metadatas, ids } = await processPDFByPage(
      pdfPath,
      sourceName
    );
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Total chunks: ${documents.length}`);
    console.log(`   - Average chunk size: ${Math.round(documents.reduce((sum, d) => sum + d.length, 0) / documents.length)} chars`);
    
    // Insert into ChromaDB
    console.log('\n💾 Inserting into ChromaDB...');
    await addDocuments(documents, metadatas, ids);
    
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
```

---

## 🎯 Best Practices for PDF Data

### 1. Chunking Strategy

**Why chunk?**
- Better search precision
- Faster retrieval
- More relevant results

**Recommended chunk sizes:**

| Content Type | Chunk Size | Overlap | Why |
|--------------|------------|---------|-----|
| Textbooks | 800-1200 words | 150-200 | Complete concepts |
| Papers | 400-600 words | 100-150 | Abstract/section level |
| Documentation | 200-400 words | 50-100 | Specific procedures |
| Definitions | 100-200 words | 20-50 | Single concepts |

### 2. Metadata Structure

**Essential metadata:**

```typescript
interface DocumentMetadata {
  // Required
  source: string;              // "CMA Study Guide - Part 1"
  page: number;                // 45
  
  // Highly recommended
  chapter?: string;            // "Chapter 3: Cost Analysis"
  section?: string;            // "3.2 Variable Costs"
  topic?: string;              // "Cost Accounting"
  
  // Optional but useful
  keywords?: string[];         // ["COGS", "inventory", "accounting"]
  difficulty?: string;         // "beginner" | "intermediate" | "advanced"
  exam_relevance?: number;     // 1-10
  last_updated?: string;       // "2024-01-15"
  author?: string;             // "John Smith"
}
```

### 3. ID Naming Convention

**Good ID patterns:**

```typescript
// Page-based
`cma-guide-page-${pageNum}`

// Chapter-based
`cma-guide-ch${chapter}-sec${section}`

// Topic-based
`${source}-${topic}-${index}`

// Hierarchical
`cma/part1/chapter3/section2/chunk-${index}`
```

**Bad ID patterns:**
- `1`, `2`, `3` (not descriptive)
- `document` (not unique)
- Random UUIDs (hard to debug)

---

## 📝 Complete Working Example

### Example: Process Multiple PDFs

Create `scripts/batchProcessPDFs.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { addDocuments, initChromaDB, clearCollection } from '../lib/chromaService';

interface PDFFile {
  path: string;
  name: string;
  category: string;
}

// Your PDF files
const pdfFiles: PDFFile[] = [
  {
    path: './documents/cma-part1.pdf',
    name: 'CMA Study Guide - Part 1',
    category: 'Financial Accounting',
  },
  {
    path: './documents/cma-part2.pdf',
    name: 'CMA Study Guide - Part 2',
    category: 'Strategic Management',
  },
  {
    path: './documents/cpa-far.pdf',
    name: 'CPA - Financial Accounting',
    category: 'Financial Accounting',
  },
];

async function processPDFFile(file: PDFFile) {
  console.log(`\n📄 Processing: ${file.name}`);
  
  try {
    // Read PDF
    const dataBuffer = fs.readFileSync(file.path);
    const data = await pdf(dataBuffer);
    
    // Clean and chunk text
    const cleanText = data.text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    const chunks = chunkTextBySentence(cleanText, 800, 150);
    
    console.log(`   ✓ Extracted ${chunks.length} chunks from ${data.numpages} pages`);
    
    // Prepare for ChromaDB
    const documents = chunks;
    const metadatas = chunks.map((_, index) => ({
      source: file.name,
      category: file.category,
      page: Math.floor((index * 800) / (cleanText.length / data.numpages)),
      total_pages: data.numpages,
      chunk_index: index,
      processed_date: new Date().toISOString(),
    }));
    const ids = chunks.map((_, index) => 
      `${file.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-chunk-${index}`
    );
    
    return { documents, metadatas, ids };
    
  } catch (error) {
    console.error(`   ❌ Error processing ${file.name}:`, error);
    return null;
  }
}

function chunkTextBySentence(
  text: string,
  targetSize: number = 800,
  overlap: number = 150
): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let wordCount = 0;
  
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    
    if (wordCount + words.length > targetSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' ').trim());
      
      // Keep overlap sentences
      const overlapSentences = Math.ceil(overlap / (wordCount / currentChunk.length));
      currentChunk = currentChunk.slice(-overlapSentences);
      wordCount = currentChunk.reduce((sum, s) => sum + s.split(/\s+/).length, 0);
    }
    
    currentChunk.push(sentence.trim());
    wordCount += words.length;
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' ').trim());
  }
  
  return chunks.filter(chunk => chunk.length > 100); // Filter very small chunks
}

async function main() {
  try {
    console.log('🚀 Starting batch PDF processing...\n');
    
    // Initialize ChromaDB
    await initChromaDB();
    
    // Optional: Clear existing data
    // await clearCollection();
    // console.log('🗑️  Cleared existing collection\n');
    
    // Process all PDFs
    const allDocuments: string[] = [];
    const allMetadatas: any[] = [];
    const allIds: string[] = [];
    
    for (const file of pdfFiles) {
      const result = await processPDFFile(file);
      
      if (result) {
        allDocuments.push(...result.documents);
        allMetadatas.push(...result.metadatas);
        allIds.push(...result.ids);
      }
    }
    
    // Insert all at once
    if (allDocuments.length > 0) {
      console.log(`\n💾 Inserting ${allDocuments.length} total chunks into ChromaDB...`);
      await addDocuments(allDocuments, allMetadatas, allIds);
      console.log('✅ Successfully inserted all documents!');
    }
    
    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   - Files processed: ${pdfFiles.length}`);
    console.log(`   - Total chunks: ${allDocuments.length}`);
    console.log(`   - Average chunk size: ${Math.round(allDocuments.reduce((sum, d) => sum + d.length, 0) / allDocuments.length)} characters`);
    console.log(`   - Categories: ${[...new Set(allMetadatas.map(m => m.category))].join(', ')}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
```

### Run it:

```bash
# Add script to package.json
npm pkg set scripts.process-pdfs="npx tsx scripts/batchProcessPDFs.ts"

# Run
npm run process-pdfs
```

---

## 🎯 Data Quality Tips

### 1. Clean Your Text

```typescript
function cleanPDFText(text: string): string {
  return text
    .replace(/\s+/g, ' ')                    // Multiple spaces → single
    .replace(/\n+/g, '\n')                   // Multiple newlines → single
    .replace(/[^\x00-\x7F]/g, '')            // Remove non-ASCII
    .replace(/(\r\n|\n|\r)/gm, ' ')          // Line breaks → spaces
    .replace(/\s*([.!?])\s*/g, '$1 ')        // Fix punctuation spacing
    .trim();
}
```

### 2. Filter Bad Chunks

```typescript
function isValidChunk(text: string): boolean {
  // Too short
  if (text.length < 100) return false;
  
  // Too many numbers (probably a table)
  if ((text.match(/\d/g) || []).length / text.length > 0.3) return false;
  
  // Not enough words
  if (text.split(/\s+/).length < 20) return false;
  
  // Contains valid sentences
  if (!text.match(/[.!?]/)) return false;
  
  return true;
}
```

### 3. Extract Structured Data

```typescript
function extractMetadata(text: string, pageNum: number) {
  const metadata: any = {
    page: pageNum,
  };
  
  // Extract chapter
  const chapterMatch = text.match(/chapter\s+(\d+):\s*([^\n]+)/i);
  if (chapterMatch) {
    metadata.chapter = parseInt(chapterMatch[1]);
    metadata.chapter_title = chapterMatch[2].trim();
  }
  
  // Extract formulas
  const formulas = text.match(/([A-Z][a-z]+\s*=\s*[^.]+)/g);
  if (formulas) {
    metadata.has_formulas = true;
    metadata.formula_count = formulas.length;
  }
  
  // Extract key terms (simple version)
  const keyTerms = text.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/g);
  if (keyTerms) {
    metadata.key_terms = [...new Set(keyTerms)].slice(0, 5);
  }
  
  return metadata;
}
```

---

## 📊 Testing Your Data

### Create Test Script:

```typescript
// scripts/testChromaDB.ts
import { semanticSearch, getCollectionStats } from '../lib/chromaService';

async function testSearch() {
  // Get stats
  const stats = await getCollectionStats();
  console.log('Collection stats:', stats);
  
  // Test searches
  const testQueries = [
    'What is Net Present Value?',
    'How to calculate COGS?',
    'Financial ratios for liquidity',
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Query: "${query}"`);
    const results = await semanticSearch(query, 3);
    
    results.documents[0].forEach((doc, i) => {
      console.log(`\n${i + 1}. ${doc.substring(0, 200)}...`);
      console.log(`   Metadata:`, results.metadatas[0][i]);
    });
  }
}

testSearch();
```

---

## 📦 Complete Package.json Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "populate-chroma": "npx tsx scripts/populateChromaDB.ts",
    "process-pdf": "npx tsx scripts/processPDF.ts",
    "batch-pdfs": "npx tsx scripts/batchProcessPDFs.ts",
    "test-chroma": "npx tsx scripts/testChromaDB.ts"
  }
}
```

---

## ✅ Quick Reference

### Insert Simple Text:
```typescript
await addDocuments(
  ['text1', 'text2'],           // documents
  [{page: 1}, {page: 2}],       // metadata
  ['id-1', 'id-2']              // ids
);
```

### Process PDF:
```bash
npm install pdf-parse
npm run process-pdf
```

### Best Chunk Size:
- Textbooks: 800-1200 words
- Papers: 400-600 words
- Definitions: 100-200 words

### ID Format:
```
source-type-identifier-chunk
Example: cma-guide-page-45-chunk-2
```

---

Need help with your specific PDF? Let me know! 🚀

