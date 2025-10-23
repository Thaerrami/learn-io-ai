# Cost Optimization Guide for Learn.io

## 📊 Current Cost Analysis (OpenAI GPT-3.5-Turbo)

### Pricing (as of 2024)
- **Input**: $0.0015 per 1K tokens
- **Output**: $0.002 per 1K tokens

### Average Token Usage Per Request

#### MCQ Generation:
- **Input tokens**: ~600-800 tokens (prompt + base question)
- **Output tokens**: ~300-500 tokens (question + options + explanation)
- **Cost per MCQ**: ~$0.002-0.003

#### Chapter Summary:
- **Input tokens**: ~500-700 tokens (prompt + chapter name)
- **Output tokens**: ~800-1200 tokens (summary + keywords)
- **Cost per Summary**: ~$0.003-0.005

---

## 💰 Monthly Cost Scenarios

### Scenario 1: Small Scale (100 active users/day)
**Usage Pattern:**
- 5 MCQs per user per day = 500 MCQs/day
- 1 chapter summary per user per week = ~15 summaries/day

**Monthly Costs:**
- MCQs: 500 × 30 × $0.0025 = **$37.50/month**
- Summaries: 15 × 30 × $0.004 = **$1.80/month**
- **Total: ~$40/month**

### Scenario 2: Medium Scale (1,000 active users/day)
**Usage Pattern:**
- 5 MCQs per user per day = 5,000 MCQs/day
- 1 chapter summary per user per week = ~150 summaries/day

**Monthly Costs:**
- MCQs: 5,000 × 30 × $0.0025 = **$375/month**
- Summaries: 150 × 30 × $0.004 = **$18/month**
- **Total: ~$400/month**

### Scenario 3: Large Scale (10,000 active users/day)
**Usage Pattern:**
- 5 MCQs per user per day = 50,000 MCQs/day
- 1 chapter summary per user per week = ~1,500 summaries/day

**Monthly Costs:**
- MCQs: 50,000 × 30 × $0.0025 = **$3,750/month**
- Summaries: 1,500 × 30 × $0.004 = **$180/month**
- **Total: ~$4,000/month**

---

## 🚀 Cost Optimization Strategies

### 1. **Aggressive Caching (Save 60-80%)**

#### Implementation:
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

export async function getCachedMCQ(
  topicId: string, 
  level: string, 
  questionId: string
): Promise<any | null> {
  const key = `mcq:${topicId}:${level}:${questionId}`
  return await redis.get(key)
}

export async function cacheMCQ(
  topicId: string,
  level: string, 
  questionId: string,
  data: any
) {
  const key = `mcq:${topicId}:${level}:${questionId}`
  // Cache for 7 days
  await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(data))
}
```

**Cost Savings:**
- Pre-generate 5-10 variations per question during off-peak hours
- Cache for 7-30 days
- **Reduces API calls by 60-80%**
- **New cost: $80-160/month for 1,000 users** (instead of $400)

**Redis/Upstash Cost:**
- Free tier: 10,000 commands/day
- Paid: ~$10/month for moderate usage

---

### 2. **Use GPT-3.5-Turbo-1106 (Cheaper Variant)**

Latest GPT-3.5 version is more efficient:
- **20-30% cheaper** than base GPT-3.5-Turbo
- Faster response times
- Better JSON output

**Implementation:**
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo-1106', // Instead of 'gpt-3.5-turbo'
  // ... rest of config
});
```

---

### 3. **Batch Processing (Save 40-50%)**

Generate multiple questions in a single API call:

```typescript
// Generate 5 MCQs at once
const prompt = `Generate 5 different MCQ variations for the following base questions...`;

// Single API call instead of 5 separate calls
// Saves on per-request overhead
```

**Savings:**
- Reduces total tokens by ~40% (less redundant prompt data)
- Fewer API requests = lower costs

---

### 4. **Smart Rate Limiting**

```typescript
// Limit users to prevent abuse
const LIMITS = {
  mcq_per_day: 20,        // Reasonable for study
  summary_per_day: 5,     // More than enough
  mcq_per_hour: 5,        // Prevent spamming
}
```

**Prevents:**
- Bot abuse
- Unnecessary regenerations
- Cost overruns

---

### 5. **Pre-Generation Strategy (Save 70-90%)**

Generate content during off-peak hours:

```typescript
// Cron job that runs nightly
async function preGenerateContent() {
  for (const topic of topics) {
    for (const level of ['beginner', 'intermediate', 'advanced']) {
      // Generate 10 variations
      for (let i = 0; i < 10; i++) {
        const mcq = await generateMCQ(topic, level)
        await cacheInDatabase(mcq)
      }
    }
  }
}
```

**Benefits:**
- Generate when costs are predictable
- Serve from database (almost free)
- Only regenerate if cache empty
- **Potential savings: 70-90%**

---

### 6. **Alternative: Fine-Tuned Model (Long-term)**

For high-volume (>100K requests/month):

**Process:**
1. Generate 1,000-2,000 high-quality examples
2. Fine-tune GPT-3.5-Turbo on your data
3. Use fine-tuned model

**Costs:**
- Training: One-time $50-100
- Inference: ~30-40% cheaper than base model
- **Break-even point: ~50,000 requests**

**Note:** Best for established products with consistent patterns

---

## 🔄 Alternative Technologies & APIs

### Option 1: **Open-Source LLMs (Lowest Cost)**

#### A. **Llama 3 (8B or 70B) via Groq**
- **Cost**: $0.0001-0.0003 per 1K tokens
- **Speed**: 10x faster than OpenAI
- **Savings**: **90-95% cheaper**

```typescript
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const completion = await groq.chat.completions.create({
  model: "llama-3.1-70b-versatile",
  messages: [/* same format as OpenAI */],
})
```

**Pros:**
- Extremely cheap
- Fast inference
- Good quality for educational content

**Cons:**
- Slightly lower quality than GPT-4
- Less consistent JSON formatting

**New Monthly Cost (1,000 users):** ~$20-40/month

---

#### B. **Mistral AI**
- **Cost**: $0.0002 per 1K tokens
- **Models**: Mistral-Small, Mistral-Medium
- **Quality**: Very good for structured tasks

```typescript
import MistralClient from '@mistralai/mistralai';

const client = new MistralClient(process.env.MISTRAL_API_KEY);

const response = await client.chat({
  model: 'mistral-small',
  messages: [/* your messages */],
})
```

**Monthly Cost (1,000 users):** ~$30-50/month

---

#### C. **Together AI (Self-Hosted Open Models)**
- **Cost**: $0.0002-0.0008 per 1K tokens
- **Models**: Llama, Mistral, CodeLlama, etc.
- **Flexibility**: Choose model based on task

**Monthly Cost (1,000 users):** ~$40-80/month

---

### Option 2: **Hybrid Approach (Best Value)**

Use different models for different tasks:

```typescript
// High-quality for complex explanations
const complexTask = {
  model: 'gpt-3.5-turbo',
  use_for: ['chapter_summaries', 'detailed_explanations']
}

// Fast & cheap for simple tasks
const simpleTask = {
  model: 'llama-3-70b' via Groq,
  use_for: ['mcq_generation', 'answer_checking']
}
```

**Cost Breakdown:**
- 70% of requests → Cheap model ($0.0002/1K tokens)
- 30% of requests → GPT-3.5 ($0.002/1K tokens)
- **Average cost per request: ~$0.0008**
- **Monthly (1,000 users): ~$120/month**
- **Savings: 70%**

---

### Option 3: **Claude 3 Haiku (High Quality, Competitive Price)**

Anthropic's fastest, cheapest model:
- **Cost**: $0.00025 per 1K input tokens, $0.00125 per 1K output tokens
- **Quality**: Better than GPT-3.5 for many tasks
- **Speed**: Very fast

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307',
  max_tokens: 1024,
  messages: [/* your messages */],
});
```

**Monthly Cost (1,000 users):** ~$150-200/month

---

## 📈 Recommended Cost Optimization Roadmap

### Phase 1: Immediate (Save 60%)
1. ✅ **Add Redis caching** with Upstash (free tier)
2. ✅ **Implement rate limiting** (5 MCQs/hour, 20/day)
3. ✅ **Switch to GPT-3.5-Turbo-1106** (latest, cheaper)
4. ✅ **Add user-based caching** (same user = same content for 24h)

**New Cost:** $160/month (instead of $400) for 1,000 users

---

### Phase 2: Short-term (Save 80%)
1. ✅ **Pre-generate 10 variations** of each question
2. ✅ **Store in PostgreSQL** or MongoDB
3. ✅ **Serve from database** 90% of the time
4. ✅ **Only regenerate** when pool is low

**New Cost:** $80/month for 1,000 users

---

### Phase 3: Long-term (Save 90%)
1. ✅ **Switch to Groq + Llama 3** for MCQ generation
2. ✅ **Keep GPT-3.5** for complex summaries only
3. ✅ **Implement CDN caching** for static responses
4. ✅ **Add intelligent pre-fetching**

**New Cost:** $40/month for 1,000 users

---

## 💡 Feature Adjustments to Save Costs

### 1. **Smart Refresh vs Full Generation**

Instead of generating from scratch, modify existing questions:

```typescript
// Cheap approach: Just swap numbers
function quickRefresh(question: Question): Question {
  return {
    ...question,
    // Use simple string replacement for numbers
    question_text: swapNumbers(question.question_text),
    // No API call needed!
  }
}

// Expensive approach: Full AI generation
async function fullRefresh(question: Question): Question {
  return await openai.generate(/* ... */)
}

// Use cheap approach 80% of the time
const shouldUseAI = Math.random() < 0.2
```

**Savings:** 80% reduction in API calls

---

### 2. **Lazy Loading RAG Definitions**

Don't pre-load all keyword definitions:

```typescript
// Current (expensive): Load all definitions upfront
include_rag_links: true // Costs 5-10 extra API calls

// Optimized (cheap): Load on-demand when user clicks
include_rag_links: false // Only call API when needed
```

**Savings:** $0.003 → $0.0005 per summary (83% reduction)

---

### 3. **Tiered Access**

```typescript
const TIERS = {
  free: {
    mcq_per_day: 5,
    summaries_per_day: 1,
    uses_cache: true,        // Always cached content
  },
  premium: {
    mcq_per_day: 50,
    summaries_per_day: 10,
    uses_cache: false,       // Fresh AI generation
  }
}
```

**Result:** 
- 80% of users use free (cached) tier = minimal cost
- 20% pay for premium = covers costs + profit

---

### 4. **Question Pool Rotation**

```typescript
// Instead of infinite variations:
// - Maintain pool of 100 pre-generated questions per topic
// - Rotate based on user history
// - Only regenerate monthly

const POOL_SIZE = 100
const REGENERATE_INTERVAL = 30 * 24 * 60 * 60 * 1000 // 30 days
```

**Benefits:**
- Predictable costs
- High quality (curated)
- Nearly instant responses

---

## 🎯 Recommended Strategy for Your Use Case

### For MVP/Testing (0-100 users):
**Current Setup (OpenAI GPT-3.5) + Basic Caching**
- Cost: ~$10-40/month
- Easy to implement
- Good quality
- ✅ **What you have now is perfect!**

### For Growth (100-1,000 users):
**Hybrid: Groq (Llama 3) + OpenAI + Aggressive Caching**
- Cost: ~$50-100/month
- 75% cost reduction
- Maintain quality for complex tasks
- Pre-generate popular content

### For Scale (1,000-10,000 users):
**Pre-Generation + Database + Groq**
- Cost: ~$200-400/month
- 90% cost reduction
- Serve from database primarily
- AI only for new content

### For Enterprise (10,000+ users):
**Fine-tuned Model + Pre-Generation + CDN**
- Cost: ~$500-1,000/month
- 95% cost reduction
- Custom model trained on your data
- Global CDN for instant responses

---

## 📝 Implementation Priority

### Week 1: Quick Wins (2-3 hours implementation)
1. Add Redis/Upstash caching
2. Implement rate limiting
3. Switch to GPT-3.5-Turbo-1106

**Expected Savings: 50-60%**

### Week 2: Medium Effort (1-2 days)
1. Pre-generate 10 variations per question
2. Store in database (PostgreSQL/MongoDB)
3. Serve from DB first, API as fallback

**Expected Savings: 70-80%**

### Month 2: Long-term (1 week)
1. Test Groq/Llama 3 for MCQ generation
2. Keep OpenAI for summaries
3. Implement smart pre-fetching

**Expected Savings: 85-90%**

---

## 🔧 Quick Implementation: Add Caching Now

Here's code you can add today to save 50%:

```typescript
// Create: lib/simpleCache.ts
const cache = new Map<string, { data: any; expires: number }>()

export function getCached(key: string): any | null {
  const item = cache.get(key)
  if (!item || Date.now() > item.expires) {
    cache.delete(key)
    return null
  }
  return item.data
}

export function setCache(key: string, data: any, ttlSeconds = 3600) {
  cache.set(key, {
    data,
    expires: Date.now() + (ttlSeconds * 1000)
  })
}
```

```typescript
// Update: app/api/generate-mcq/route.ts
import { getCached, setCache } from '@/lib/simpleCache'

export async function POST(request: NextRequest) {
  const { topic_id, performance_level } = await request.json()
  
  // Check cache first
  const cacheKey = `${topic_id}:${performance_level}:${baseQuestion.id}`
  const cached = getCached(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }
  
  // Generate new (your existing code)
  const result = await generateMCQ(...)
  
  // Cache for 1 hour
  setCache(cacheKey, result, 3600)
  
  return NextResponse.json(result)
}
```

**Immediate savings: 40-60%** with just 10 minutes of work!

---

## 📊 Summary

| Solution | Monthly Cost (1K users) | Savings | Implementation |
|----------|------------------------|---------|----------------|
| Current (OpenAI only) | $400 | 0% | ✅ Done |
| + Basic Caching | $160 | 60% | 1 hour |
| + Pre-generation | $80 | 80% | 1 day |
| + Groq/Llama 3 | $40 | 90% | 1 week |
| Full Optimization | $20 | 95% | 1 month |

**Recommendation:** Start with basic caching (1 hour work, 60% savings), then gradually optimize as you grow.

