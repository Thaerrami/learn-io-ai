# 🚀 START HERE - Quick Setup Guide

## ✅ All Code Issues Fixed!

The system is ready. Just follow these 3 simple steps:

---

## Step 1: Start ChromaDB Server 🐳

**Open a NEW terminal window** and run:

```bash
docker run -p 8000:8000 chromadb/chroma
```

**Keep this terminal open!** ChromaDB needs to run continuously.

**Verify it's running:**
```bash
curl http://localhost:8000/api/v1/heartbeat
```

You should see: `{"nanosecond heartbeat": ...}`

---

## Step 2: Add Your OpenAI API Key 🔑

Create or edit `.env.local` in the project root:

```bash
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
CHROMA_URL=http://localhost:8000
```

**After adding the key, restart the dev server:**
```bash
# Press Ctrl+C in the terminal running npm run dev
# Then start it again:
npm run dev
```

---

## Step 3: Ingest PDFs (First Time Only) 📚

**Open another NEW terminal window** and run:

```bash
cd /Users/talazzeh/Desktop/development/out_source/learn-io-ai
npm run chroma:ingest
```

This will:
- Load Chapter 1.pdf (~247 chunks)
- Load Testbank questions (~45 questions)
- Store everything in ChromaDB

**Expected output:**
```
✅ Extracted 247 chunks from Chapter 1
✅ Added 247 documents to ChromaDB
✅ Extracted 45 questions from Testbank
✅ Added 45 documents to ChromaDB
✅ Total documents: 292
```

---

## 🎉 That's It! Now Test:

### Test 1: MCQ Generator
1. Go to: **http://localhost:3000/mcq-demo**
2. Enter:
   - **Topic:** Cost Behavior
   - **Question:** What are fixed costs?
   - **Level:** Intermediate
   - **Pattern:** Scenario Analysis
3. Click **"Generate MCQ"**
4. Answer and see explanation with sources!

### Test 2: Chapter Summary
1. Go to: **http://localhost:3000/chapter-summary**
2. Enter:
   - **Chapter:** Chapter 1: Management Accounting
   - **Keywords:** cost behavior, fixed costs, variable costs
3. Click **"Generate Summary"**
4. See summary with sources and page numbers!

---

## ✅ What Got Fixed:

| Issue | Status |
|-------|--------|
| ChromaDB embedding error | ✅ Fixed - Server handles embeddings |
| OpenAI JSON mode error | ✅ Fixed - Using gpt-4-turbo-preview |
| Module import issues | ✅ Fixed - Lazy loading |
| Webpack config | ✅ Fixed - External ChromaDB |

---

## 🛟 Troubleshooting

### "Failed to generate MCQ"
✅ **Solution:** Make sure ChromaDB is running on port 8000

```bash
docker ps | grep chroma
```

If not running:
```bash
docker run -d --name chromadb -p 8000:8000 chromadb/chroma
```

### "OpenAI API error"
✅ **Solution:** Check your API key in `.env.local` and restart server

### "No documents found"
✅ **Solution:** Run the ingestion script:
```bash
npm run chroma:ingest
```

---

## 📊 System Architecture

```
Your Browser
    ↓
Next.js App (localhost:3000)
    ↓
API Routes (/api/generate-mcq, /api/chapter-summary)
    ↓
RAG Service (searches for context)
    ↓
ChromaDB Server (localhost:8000) → Semantic Search
    ↓
Returns: Textbook chunks + Testbank examples
    ↓
GPT-4 Turbo (generates answer with context)
    ↓
Response with sources and page numbers
```

---

## 💰 Cost Per Request

| Operation | Cost |
|-----------|------|
| ChromaDB search | Free |
| Embeddings (server-side) | Free (built-in) |
| GPT-4 Turbo generation | $0.01-0.02 |
| **Total per question** | **$0.01-0.02** |

Much cheaper than fine-tuning! ($0 setup vs $8-50)

---

## 🎯 Quick Commands

```bash
# Start ChromaDB
docker run -p 8000:8000 chromadb/chroma

# Start dev server
npm run dev

# Ingest PDFs
npm run chroma:ingest

# Check ChromaDB status
curl http://localhost:3000/api/ingest-pdf

# Stop ChromaDB
docker stop chromadb

# Start existing ChromaDB container
docker start chromadb
```

---

## 🎓 You're All Set!

The system uses **RAG + Few-Shot Learning** instead of fine-tuning:
- ✅ $0 training cost
- ✅ Instant updates
- ✅ Works with small datasets (45 testbank questions)
- ✅ Provides source attribution
- ✅ Transparent (see which examples are used)

Happy learning! 🚀✨

