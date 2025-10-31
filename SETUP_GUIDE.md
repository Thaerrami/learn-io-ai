# 🚀 Learn.io AI Setup Guide

## RAG-Powered Educational Platform with ChromaDB

This guide will help you set up and run the complete RAG system with ChromaDB for generating chapter summaries and adaptive MCQs.

---

## 📋 Prerequisites

- Node.js 18+ installed
- Docker installed (for ChromaDB)
- OpenAI API key

---

## 🔧 Step 1: Install Dependencies

```bash
npm install
```

**Installed packages:**
- `chromadb` - Vector database client
- `pdf-parse` - PDF text extraction
- `openai` - GPT-4 integration
- Next.js, React, TypeScript, Tailwind CSS

---

## 🐳 Step 2: Start ChromaDB

ChromaDB is required for RAG (Retrieval-Augmented Generation). Start it with Docker:

```bash
docker run -p 8000:8000 chromadb/chroma
```

**What is ChromaDB?**
- Vector database for semantic search
- Stores PDF content as embeddings
- Enables context-aware question generation
- Provides source attribution for answers

Keep this terminal window open - ChromaDB needs to run continuously.

---

## 🔑 Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
CHROMA_URL=http://localhost:8000
```

---

## 📚 Step 4: Ingest PDF Content

Load the Chapter 1 PDF and Testbank into ChromaDB:

```bash
npx ts-node scripts/ingestPDFs.ts
```

**What happens:**
1. Reads `app/samples/Chapter 1.pdf`
2. Extracts text and chunks it into ~500 character segments
3. Reads `app/samples/Testbank Chapter (1).pdf`
4. Extracts questions with options and answers
5. Stores everything in ChromaDB with metadata (page numbers, sources)

**Expected output:**
```
📚 Starting PDF ingestion...
🔌 Connecting to ChromaDB...
✅ Connected to existing ChromaDB collection: educational_content
📖 Processing Chapter 1.pdf...
   ✅ Extracted 247 chunks from Chapter 1
💾 Adding Chapter 1 to ChromaDB...
   ✅ Added 247 documents to ChromaDB
📝 Processing Testbank Chapter (1).pdf...
   ✅ Extracted 45 questions from Testbank
💾 Adding Testbank questions to ChromaDB...
   ✅ Added 45 documents to ChromaDB
📊 Final Statistics:
   Collection: educational_content
   Total documents: 292
   Status: connected
✅ PDF ingestion complete!
```

---

## 🎯 Step 5: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎓 Features & Demo Pages

### 1️⃣ **Chapter Summary Generator** (`/chapter-summary`)

**Features:**
- RAG-powered summaries using actual textbook content
- Keyword-focused explanations
- Source citations with page numbers
- ChromaDB status indicator

**How to use:**
1. Enter chapter name (e.g., "Chapter 1: Introduction to Management Accounting")
2. Add keywords (e.g., "cost behavior, fixed costs, variable costs")
3. Click "Generate Summary"
4. View summary with sources and citations

**Behind the scenes:**
- Searches ChromaDB for relevant content
- Retrieves keyword definitions from textbook
- Provides context to GPT-4 with source citations
- GPT-4 generates comprehensive summary
- Returns summary with page references

---

### 2️⃣ **MCQ Generator** (`/mcq-demo`)

**Features:**
- Adaptive difficulty levels (Beginner, Intermediate, Advanced)
- Multiple question patterns (Recall, Calculation, Scenario)
- Testbank-style questions
- Source attribution
- Interactive answer checking

**How to use:**
1. Enter topic (e.g., "Cost Behavior")
2. Enter base question or concept
3. Select student level from dropdown
4. Select question pattern
5. Click "Generate MCQ"
6. Answer the question and view explanation

**Behind the scenes:**
- Searches ChromaDB for relevant textbook content
- Retrieves similar questions from testbank
- Provides examples to GPT-4 (few-shot learning)
- GPT-4 generates new question in testbank style
- Returns question with sources and page numbers

---

## 🧪 API Endpoints

### **POST `/api/chapter-summary`**
Generate chapter summaries with RAG

```json
{
  "chapter_name": "Chapter 1: Introduction",
  "core_keywords": ["cost behavior", "fixed costs"]
}
```

### **POST `/api/generate-mcq`**
Generate adaptive MCQs

```json
{
  "topic_id": "Cost Behavior",
  "original_question": "What are fixed costs?",
  "user_performance_level": "intermediate",
  "pattern_type": "scenario_analysis"
}
```

### **GET `/api/ingest-pdf`**
Check ChromaDB status

Returns collection statistics and connection status.

---

## 🔍 How RAG Works

### Traditional Approach (Without RAG):
```
User Question → GPT-4 → Generic Answer
```

### RAG Approach (With ChromaDB):
```
User Question 
  → Search ChromaDB (semantic similarity)
  → Retrieve relevant textbook chunks
  → Retrieve testbank examples
  → Provide context to GPT-4
  → GPT-4 generates answer with sources
  → Return answer + citations
```

### Benefits:
- ✅ **Accurate**: Uses actual textbook content
- ✅ **Traceable**: Every answer has source citations
- ✅ **Cost-effective**: No fine-tuning needed
- ✅ **Flexible**: Easy to update content
- ✅ **Transparent**: See what sources were used

---

## 📊 Cost Comparison

| Approach | Setup Cost | Per Question | Flexibility |
|----------|------------|--------------|-------------|
| **RAG (Current)** | $0 | $0.01-0.03 | High ✅ |
| **Fine-tuning** | $8-50 | $0.002-0.01 | Low ❌ |

RAG is better for:
- Evolving content
- Small datasets (<1000 examples)
- Need for source attribution
- Quick iteration

---

## 🛠️ Troubleshooting

### ChromaDB Connection Failed
```
❌ Failed to initialize ChromaDB
💡 Make sure ChromaDB is running: docker run -p 8000:8000 chromadb/chroma
```

**Solution:** Start ChromaDB with Docker (see Step 2)

### No Documents in Collection
```
Status: connected
Total documents: 0
```

**Solution:** Run the ingestion script (see Step 4)

### OpenAI API Error
```
Error: OpenAI API key not found
```

**Solution:** Add `OPENAI_API_KEY` to `.env.local`

### PDF Not Found
```
Error: ENOENT: no such file or directory
```

**Solution:** Ensure PDFs are in `app/samples/` directory

---

## 📁 Project Structure

```
learn-io-ai/
├── app/
│   ├── api/
│   │   ├── chapter-summary/route.ts    # Summary generation API
│   │   ├── generate-mcq/route.ts       # MCQ generation API
│   │   └── ingest-pdf/route.ts         # Status check API
│   ├── chapter-summary/page.tsx        # Summary demo UI
│   ├── mcq-demo/page.tsx               # MCQ demo UI
│   └── samples/
│       ├── Chapter 1.pdf               # Textbook content
│       └── Testbank Chapter (1).pdf    # Example questions
├── lib/
│   ├── chromaService.ts                # ChromaDB operations
│   ├── pdfService.ts                   # PDF processing
│   ├── ragService.ts                   # RAG search functions
│   └── types.ts                        # TypeScript interfaces
├── scripts/
│   └── ingestPDFs.ts                   # PDF ingestion script
└── .env.local                          # Environment variables
```

---

## 🎯 Next Steps

1. **Add More Content**: Ingest additional chapters
2. **Improve Chunking**: Optimize chunk size for better retrieval
3. **Add Caching**: Cache frequent queries
4. **User Profiles**: Track student performance
5. **Analytics**: Monitor question difficulty and success rates

---

## 📚 Resources

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

## 🤝 Support

For issues or questions, check:
- ChromaDB is running on port 8000
- PDFs are properly ingested
- OpenAI API key is valid
- All dependencies are installed

Happy learning! 🎓✨


