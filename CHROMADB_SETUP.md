# ChromaDB RAG Implementation Guide

## 🎯 What is ChromaDB?

ChromaDB is an open-source vector database designed for AI applications. It stores embeddings (vector representations) of text and enables semantic search - finding content by meaning rather than exact keywords.

### Why ChromaDB for RAG?

- ✅ **Semantic Search**: Finds content by meaning, not just keywords
- ✅ **Fast**: Optimized for similarity search
- ✅ **Open Source**: Free and self-hostable
- ✅ **Easy Integration**: Simple API
- ✅ **Persistent Storage**: Data survives restarts

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start ChromaDB

**Option A: Using Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option B: Using Docker Directly**
```bash
docker run -p 8000:8000 chromadb/chroma
```

**Option C: Using npm script**
```bash
npm run chroma:docker
```

### Step 2: Populate the Database

```bash
npm run populate-chroma
```

This will add ~15 educational documents to ChromaDB covering:
- Financial Statement Analysis
- Cost Accounting concepts
- Capital Budgeting (NPV, IRR)
- Financial Ratios
- Cash Flow Analysis

### Step 3: Test It!

Your Next.js app will automatically use ChromaDB for RAG searches.

```bash
# Start your app (if not already running)
npm run dev

# Navigate to:
http://localhost:3001/chapter-summary

# Generate a summary with RAG links enabled
# Click any keyword to see definitions from ChromaDB!
```

---

## 📊 How It Works

### Architecture

```
User Request
    ↓
Next.js API
    ↓
RAG Service (lib/ragService.ts)
    ↓
    ├─→ ChromaDB (if available) ─→ Semantic Search
    │                              ↓
    │                         Vector Embeddings
    │                              ↓
    │                         Top 3 Results
    │
    └─→ Mock Data (fallback) ─→ Keyword Match
```

### What Happens When You Click a Keyword:

1. **User clicks** "Net Present Value" in summary
2. **Frontend** calls API with keyword
3. **RAG Service** checks if ChromaDB is available
4. **ChromaDB** converts keyword to embedding
5. **Vector Search** finds semantically similar content
6. **Returns** top 3 most relevant chunks
7. **Frontend** displays in tooltip

---

## 🔍 Semantic Search Examples

### Traditional Keyword Search (Old Way):
- Search: "NPV" → Only finds exact matches for "NPV"
- Search: "discount rate" → Misses content about "required rate of return"

### Semantic Search with ChromaDB (New Way):
- Search: "NPV" → Finds: "Net Present Value", "capital budgeting", "discount rate"
- Search: "discount rate" → Finds: "required rate of return", "cost of capital", "hurdle rate"
- Search: "profitability" → Finds: "ROA", "ROE", "profit margins"

**It understands meaning and context!** 🧠

---

## 📁 Project Structure

```
learn-io-demo/
├── lib/
│   ├── chromaService.ts          # ChromaDB operations
│   ├── ragService.ts              # RAG logic with fallback
│   └── types.ts                   # TypeScript definitions
├── scripts/
│   └── populateChromaDB.ts       # Database population script
├── docker-compose.yml            # ChromaDB container config
└── CHROMADB_SETUP.md            # This file
```

---

## 🛠️ Configuration

### Environment Variables

Add to `.env.local`:

```bash
# ChromaDB Configuration
CHROMA_URL=http://localhost:8000

# Optional: For production hosted ChromaDB
# CHROMA_URL=https://your-chroma-instance.com
# CHROMA_API_KEY=your_api_key
```

### Changing ChromaDB Port

Edit `docker-compose.yml`:
```yaml
ports:
  - "9000:8000"  # Change 8000 to your preferred port
```

Then update `.env.local`:
```bash
CHROMA_URL=http://localhost:9000
```

---

## 📚 Adding Your Own Content

### Option 1: Edit the Population Script

Edit `scripts/populateChromaDB.ts`:

```typescript
const educationalContent = [
  {
    id: 'your-unique-id',
    content: 'Your educational content here...',
    metadata: {
      topic: 'Your Topic',
      category: 'Category',
      keywords: ['keyword1', 'keyword2'],
      page: 123,
      source: 'Your Source',
    },
  },
  // Add more...
];
```

Then run:
```bash
npm run populate-chroma
```

### Option 2: Add Documents via API

Create a new API endpoint (`/api/admin/add-content`):

```typescript
import { addDocuments } from '@/lib/chromaService';

export async function POST(request: Request) {
  const { documents, metadatas, ids } = await request.json();
  await addDocuments(documents, metadatas, ids);
  return Response.json({ success: true });
}
```

---

## 🧪 Testing ChromaDB

### Health Check

```bash
curl http://localhost:8000/api/v1/heartbeat
```

Should return: `{"nanosecond heartbeat": ...}`

### Test Semantic Search

```typescript
// In your terminal or Node REPL
import { searchKeywordDefinition } from './lib/chromaService';

const result = await searchKeywordDefinition('profitability');
console.log(result);
```

### View All Collections

```bash
curl http://localhost:8000/api/v1/collections
```

---

## 📊 Monitoring & Stats

### Get Collection Statistics

Visit in your code or create an API endpoint:

```typescript
import { getCollectionStats } from '@/lib/chromaService';

const stats = await getCollectionStats();
console.log(stats);
// {
//   collection_name: 'educational_content',
//   document_count: 16,
//   status: 'connected'
// }
```

### Check Logs

```bash
# View ChromaDB logs
docker logs learn-io-demo-chromadb-1

# Follow logs in real-time
docker logs -f learn-io-demo-chromadb-1
```

---

## 🔧 Troubleshooting

### Issue: "Failed to initialize ChromaDB"

**Solution:**
```bash
# Make sure ChromaDB is running
docker ps | grep chroma

# If not running, start it
docker-compose up -d

# Check if port 8000 is available
lsof -i :8000
```

### Issue: "Connection refused"

**Solution:**
```bash
# Restart ChromaDB
docker-compose restart

# Or rebuild
docker-compose down
docker-compose up -d
```

### Issue: "Empty search results"

**Solution:**
```bash
# Repopulate the database
npm run populate-chroma

# Verify documents were added
curl http://localhost:8000/api/v1/collections/educational_content/count
```

### Issue: App works but no ChromaDB data

**This is normal!** The app has automatic fallback:
1. Tries ChromaDB first
2. Falls back to mock data if ChromaDB unavailable
3. Check console logs for: `⚠️ ChromaDB unavailable, falling back to mock data`

---

## 🚀 Production Deployment

### Option 1: Self-Hosted ChromaDB

**Using Docker on VPS:**
```bash
# On your server
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  -v /path/to/data:/chroma/chroma \
  -e IS_PERSISTENT=TRUE \
  chromadb/chroma
```

**Update `.env.production`:**
```bash
CHROMA_URL=http://your-server-ip:8000
```

### Option 2: Hosted ChromaDB Services

**Chroma Cloud (Recommended for production):**
```bash
CHROMA_URL=https://api.trychroma.com
CHROMA_API_KEY=your_api_key
CHROMA_TENANT=your_tenant
```

Update `lib/chromaService.ts`:
```typescript
client = new ChromaClient({
  path: process.env.CHROMA_URL,
  auth: {
    provider: "token",
    credentials: process.env.CHROMA_API_KEY,
  },
  tenant: process.env.CHROMA_TENANT,
});
```

### Option 3: Embedded ChromaDB

For lower traffic, run ChromaDB in the same container as your Next.js app.

---

## 💰 Cost Comparison

### Self-Hosted (Docker):
- **Cost**: Free (only infrastructure)
- **VPS**: $5-20/month (DigitalOcean, Linode)
- **Maintenance**: You manage updates
- **Scaling**: Manual

### Hosted ChromaDB:
- **Cost**: ~$50-200/month (based on usage)
- **Maintenance**: Fully managed
- **Scaling**: Automatic
- **Support**: Professional support included

### Recommendation:
- **Development**: Self-hosted Docker (free)
- **Small production** (<10k users): Self-hosted on VPS
- **Large production** (>10k users): Hosted service

---

## 📈 Performance Optimization

### 1. Batch Operations

```typescript
// Instead of multiple individual searches:
for (const keyword of keywords) {
  await searchKeywordDefinition(keyword);  // Slow
}

// Use batch search:
await batchKeywordSearch(keywords);  // Fast
```

### 2. Caching

Already implemented! Results are cached:
- MCQs: 1 hour
- Summaries: 24 hours
- ChromaDB queries: Automatic caching in app

### 3. Limit Results

```typescript
// Only get top 3 results (default)
const results = await semanticSearch(query, 3);

// Reduce to 1 for faster responses
const results = await semanticSearch(query, 1);
```

---

## 🔄 Migration Guide

### From Mock Data to ChromaDB

Your app already handles this automatically! When ChromaDB is available:
- ✅ Uses ChromaDB for semantic search
- ✅ Falls back to mock data if unavailable
- ✅ No code changes needed

### Adding More Content

1. **Prepare your documents**
2. **Run population script**: `npm run populate-chroma`
3. **Restart app**: Content is immediately available

---

## 🎓 Learning Resources

### ChromaDB Documentation:
- Official Docs: https://docs.trychroma.com
- GitHub: https://github.com/chroma-core/chroma
- Discord: https://discord.gg/MMeYNTmh3x

### Vector Database Concepts:
- What are embeddings?
- Semantic search vs keyword search
- Vector similarity metrics (cosine, euclidean)

---

## ✅ Checklist

Setup checklist:

- [ ] Docker installed
- [ ] ChromaDB running (`docker-compose up -d`)
- [ ] Database populated (`npm run populate-chroma`)
- [ ] App running (`npm run dev`)
- [ ] Tested keyword search in UI
- [ ] Checked logs for "🔍 Searching ChromaDB"

---

## 🆘 Getting Help

If you encounter issues:

1. **Check logs**:
   ```bash
   # App logs
   Check your terminal running `npm run dev`
   
   # ChromaDB logs
   docker logs learn-io-demo-chromadb-1
   ```

2. **Verify ChromaDB is running**:
   ```bash
   curl http://localhost:8000/api/v1/heartbeat
   ```

3. **Check collection**:
   ```bash
   curl http://localhost:8000/api/v1/collections
   ```

4. **Reset everything**:
   ```bash
   docker-compose down -v
   docker-compose up -d
   npm run populate-chroma
   ```

---

## 🎉 Success!

If you see this in your logs when generating a summary:

```
🔍 Searching ChromaDB for: Net Present Value
✅ ChromaDB returned 3 results
```

**Congratulations! ChromaDB RAG is working!** 🎊

Your app now has:
- ✅ Real vector database
- ✅ Semantic search capabilities  
- ✅ Production-ready RAG system
- ✅ Automatic fallback to mock data

---

## 📞 Quick Reference

```bash
# Start ChromaDB
docker-compose up -d

# Stop ChromaDB
docker-compose down

# Populate database
npm run populate-chroma

# View logs
docker logs -f learn-io-demo-chromadb-1

# Check health
curl http://localhost:8000/api/v1/heartbeat

# Get stats
curl http://localhost:8000/api/v1/collections/educational_content/count
```

Happy learning! 🚀

