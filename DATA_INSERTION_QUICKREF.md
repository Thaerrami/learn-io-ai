# ChromaDB Data Insertion - Quick Reference

## 🎯 TL;DR - The Basics

### Data Structure (3 Arrays, Same Length):

```typescript
{
  documents: string[],    // Your text content
  metadatas: object[],    // Info about each document
  ids: string[]          // Unique IDs
}
```

### Example:

```typescript
await addDocuments(
  // Array 1: The actual text
  [
    "Net Present Value (NPV) is...",
    "Return on Assets (ROA) is..."
  ],
  
  // Array 2: Metadata (optional but useful)
  [
    { topic: "NPV", page: 215, source: "CMA Guide" },
    { topic: "ROA", page: 185, source: "CMA Guide" }
  ],
  
  // Array 3: Unique IDs
  [
    "cma-npv-1",
    "cma-roa-1"
  ]
);
```

**That's it!** These 3 arrays is all ChromaDB needs.

---

## ⚡ Quick Start

### 1. Simple Text (Manual Entry)

```bash
# Edit: scripts/populateChromaDB.ts
# Add your documents to the educationalContent array
npm run populate-chroma
```

### 2. From PDF Files

```bash
# Install PDF processor
npm install pdf-parse

# See: PDF_TO_CHROMADB_GUIDE.md for complete instructions
```

### 3. Test Example Data

```bash
# Run example insertion script
npm run example-insert
```

---

## 📊 Data Types Explained

### 1. documents (string[])

**What**: The actual text content you want to search

**Format**: Plain text strings

**Size**: 200-1000 words recommended

**Example**:
```typescript
documents: [
  "Financial Statement Analysis is...",
  "Cost of Goods Sold formula is..."
]
```

### 2. metadatas (object[])

**What**: Additional information about each document

**Format**: Any JSON object

**Common fields**:
```typescript
{
  source: string,        // "CMA Study Guide"
  page: number,          // 45
  topic: string,         // "Financial Analysis"
  category: string,      // "Accounting"
  keywords: string[],    // ["NPV", "DCF"]
  difficulty: string,    // "beginner"
  chapter: string        // "Chapter 5"
}
```

### 3. ids (string[])

**What**: Unique identifier for each document

**Format**: String (lowercase, hyphens recommended)

**Pattern**: `source-topic-number`

**Examples**:
```typescript
ids: [
  "cma-guide-npv-1",
  "cpa-far-cogs-2",
  "textbook-ch5-p45"
]
```

---

## 🎨 Common Patterns

### Pattern 1: Page-by-Page

```typescript
// One document = One page
{
  documents: ["Page 1 text...", "Page 2 text..."],
  metadatas: [{ page: 1 }, { page: 2 }],
  ids: ["book-page-1", "book-page-2"]
}
```

### Pattern 2: Topic-by-Topic

```typescript
// One document = One concept
{
  documents: ["NPV explanation...", "ROA explanation..."],
  metadatas: [{ topic: "NPV" }, { topic: "ROA" }],
  ids: ["topic-npv", "topic-roa"]
}
```

### Pattern 3: Chunked Long Text

```typescript
// Long text split into chunks
const chunks = longText.split(/\n\n/);  // Split by paragraphs

{
  documents: chunks,
  metadatas: chunks.map((_, i) => ({ chunk: i })),
  ids: chunks.map((_, i) => `doc-chunk-${i}`)
}
```

---

## 🔧 Working with PDFs

### Simple PDF Processing:

```typescript
import pdf from 'pdf-parse';
import fs from 'fs';

// 1. Read PDF
const dataBuffer = fs.readFileSync('./my-textbook.pdf');
const data = await pdf(dataBuffer);

// 2. Get text
const text = data.text;

// 3. Clean it
const clean = text.replace(/\s+/g, ' ').trim();

// 4. Chunk it
const chunks = clean.match(/.{1,1000}/g); // 1000 chars each

// 5. Insert it
await addDocuments(
  chunks,
  chunks.map((_, i) => ({ page: i + 1 })),
  chunks.map((_, i) => `pdf-chunk-${i}`)
);
```

**Full guide**: See `PDF_TO_CHROMADB_GUIDE.md`

---

## ✅ Checklist

Before inserting data:

- [ ] All 3 arrays (documents, metadatas, ids) have same length
- [ ] IDs are unique (no duplicates)
- [ ] Documents are plain text (no HTML/formatting)
- [ ] Each document is 200-1000 words (optimal)
- [ ] Metadata includes useful info (source, page, topic)
- [ ] ChromaDB is running (`docker-compose up -d`)

---

## 🚨 Common Mistakes

### ❌ Wrong:

```typescript
// Different array lengths
documents: ["doc1", "doc2", "doc3"],
metadatas: [{ page: 1 }],  // Only 1 metadata!
ids: ["id1", "id2"]         // Only 2 IDs!
```

### ❌ Wrong:

```typescript
// Duplicate IDs
ids: ["doc-1", "doc-1", "doc-2"]  // "doc-1" appears twice!
```

### ❌ Wrong:

```typescript
// Not strings
documents: [123, true, { text: "hello" }]  // Must be strings!
```

### ✅ Correct:

```typescript
documents: ["doc1", "doc2", "doc3"],
metadatas: [{ page: 1 }, { page: 2 }, { page: 3 }],
ids: ["doc-1", "doc-2", "doc-3"]  // All same length, unique IDs
```

---

## 🎯 Recommended Sizes

| Content Type | Words per Chunk | Example |
|--------------|----------------|---------|
| Short definitions | 50-150 | Dictionary entries |
| Concepts | 200-400 | Textbook paragraphs |
| Sections | 400-800 | Textbook sections |
| Full topics | 800-1200 | Complete explanations |

**Rule of thumb**: If a chunk answers one question completely, it's the right size.

---

## 📝 Metadata Best Practices

### Essential Metadata:

```typescript
{
  source: "CMA Study Guide",     // Where from?
  page: 45,                      // Which page?
  topic: "Financial Analysis"    // What about?
}
```

### Enhanced Metadata:

```typescript
{
  source: "CMA Study Guide - Part 1",
  page: 45,
  topic: "Financial Statement Analysis",
  category: "Financial Accounting",
  chapter: "Chapter 3",
  section: "3.2 Ratio Analysis",
  keywords: ["ratios", "liquidity", "profitability"],
  difficulty: "intermediate",
  has_formula: true,
  exam_relevant: true,
  last_updated: "2024-01-15"
}
```

**More metadata = Better filtering = Better results**

---

## 🔍 Test Your Data

After inserting:

```bash
# Check document count
curl http://localhost:8000/api/v1/collections/educational_content/count

# Test search
npm run example-insert
```

Or in your app:

```typescript
import { searchKeywordDefinition } from './lib/chromaService';

const result = await searchKeywordDefinition('NPV');
console.log(result.relevant_chunks);
```

---

## 💡 Quick Tips

1. **Keep chunks focused**: One concept per chunk
2. **Use descriptive IDs**: `cma-npv-1` not `doc1`
3. **Add rich metadata**: More info = better filtering
4. **Clean your text**: Remove extra spaces, formatting
5. **Test searches**: Make sure you get good results

---

## 🚀 Ready to Start?

### Option 1: Use Example Script

```bash
npm run example-insert
```

### Option 2: Edit Existing Script

Edit `scripts/populateChromaDB.ts` and add your content.

### Option 3: Process PDFs

See `PDF_TO_CHROMADB_GUIDE.md` for complete PDF processing guide.

---

## 📚 More Resources

- **Full Setup**: `CHROMADB_SETUP.md`
- **PDF Processing**: `PDF_TO_CHROMADB_GUIDE.md`
- **Quick Start**: `CHROMADB_QUICKSTART.md`
- **Example Code**: `scripts/exampleDataInsertion.ts`

---

## 🆘 Need Help?

**Error: "IDs must be unique"**
→ Check for duplicate IDs in your array

**Error: "Arrays must have same length"**
→ Make sure documents, metadatas, and ids arrays are same size

**No search results**
→ Make sure ChromaDB is running: `docker-compose up -d`

**Search returns irrelevant results**
→ Your chunks might be too large. Try smaller chunks (400-600 words)

---

## ✨ Summary

**To insert data into ChromaDB, you need 3 things**:

1. **documents** = Array of text strings
2. **metadatas** = Array of info objects
3. **ids** = Array of unique identifiers

**All 3 arrays must have the same length.**

That's it! Everything else is optimization. 🎉

---

**Quick command reference**:

```bash
# Start ChromaDB
docker-compose up -d

# Insert example data
npm run example-insert

# Insert your own data
npm run populate-chroma

# Check status
curl http://localhost:8000/api/v1/heartbeat
```

Ready to insert your data? Go for it! 🚀

