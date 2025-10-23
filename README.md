# Learn.io - AI Education Demo

A comprehensive Next.js/OpenAI demonstration focused on proving the quality of personalized, refreshed MCQs and high-quality, linked chapter summaries for university and professional certification students (CMA/CPA level).

## 🎯 Project Goals

This demo showcases three core features in priority order:

1. **Question Quality & Refreshing (MCQs)** - Highest Priority
2. **Chapter Abstraction Quality**
3. **Keyword Source Linking (RAG)** - Cost-effective implementation

## 🚀 Features

### 1. Personalized and Refreshed MCQ Generation

- **Pattern-Based Refreshing**: Different refresh strategies based on question type
  - **Numerical Calculation**: Changes values while preserving calculation logic
  - **Scenario Analysis**: Modifies context while maintaining analytical concept
  - **Pure Recall**: Rephrases question while testing same knowledge
- **Difficulty Preservation**: Maintains core concept and complexity level
- **Didactic Explanations**: Detailed, educational explanations that teach concepts

### 2. Chapter Abstraction with AI

- **Comprehensive Summaries**: 400-600 word review-focused summaries
- **Structured Content**: Clear sections covering key concepts, formulas, and rules
- **Student-Focused**: Written as study guides for exam preparation
- **Keyword Identification**: Automatic extraction of 5-10 core technical terms

### 3. RAG-Powered Keyword Linking

- **Interactive Keywords**: Clickable terms highlighted throughout summaries
- **Source Material Access**: Click to view original textbook definitions
- **Vector Database Integration**: Mock implementation demonstrating production architecture
- **Cost-Effective Design**: Pre-loading option reduces API calls

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- OpenAI API key

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd /Users/talazzeh/Desktop/development/learn-io-demo
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## 📚 API Documentation

### POST /api/generate-mcq

Generate a personalized and refreshed MCQ based on user performance level.

**Request Body:**
```json
{
  "topic_id": "financial-analysis",
  "performance_level": "beginner"
}
```

**Parameters:**
- `topic_id` (string, required): Topic identifier
  - Options: `financial-analysis`, `cost-accounting`, `budgeting`
- `performance_level` (string, required): User's performance level
  - Options: `beginner`, `intermediate`, `advanced`

**Response:**
```json
{
  "question_text": "A company has beginning inventory of...",
  "options": {
    "A": "First option",
    "B": "Second option",
    "C": "Third option",
    "D": "Fourth option"
  },
  "correct_answer": "B",
  "explanation": "Detailed step-by-step explanation...",
  "pattern_type": "numerical_calculation",
  "difficulty_level": "beginner",
  "topic_id": "financial-analysis",
  "base_question_id": "q1",
  "generated_at": "2025-10-23T12:00:00.000Z"
}
```

**Error Responses:**
- `400`: Missing or invalid parameters
- `404`: No questions found for specified topic
- `500`: Server or OpenAI API error

### GET /api/generate-mcq

Retrieve available topics and difficulty levels.

**Response:**
```json
{
  "topics": [
    {
      "topic_id": "financial-analysis",
      "available_levels": ["beginner", "intermediate"],
      "question_count": 3
    }
  ],
  "available_performance_levels": ["beginner", "intermediate", "advanced"]
}
```

### POST /api/chapter-summary

Generate a comprehensive chapter summary with keyword identification and optional RAG linking.

**Request Body:**
```json
{
  "chapter_name": "Financial Statement Analysis",
  "include_rag_links": true
}
```

**Parameters:**
- `chapter_name` (string, required): Name of the chapter
- `include_rag_links` (boolean, optional): Pre-load RAG definitions (default: false)

**Response:**
```json
{
  "chapter_name": "Financial Statement Analysis",
  "summary_text": "Comprehensive summary content...",
  "core_keywords": ["Net Present Value", "Cost of Goods Sold", ...],
  "generated_at": "2025-10-23T12:00:00.000Z",
  "rag_definitions": {
    "Net Present Value": {
      "keyword": "Net Present Value",
      "relevant_chunks": ["Definition text...", "Formula text...", "Application text..."],
      "source_page": 42
    }
  }
}
```

**Error Responses:**
- `400`: Missing chapter_name parameter
- `500`: Server or OpenAI API error

### GET /api/chapter-summary

Retrieve available chapters.

**Response:**
```json
{
  "available_chapters": [
    {
      "chapter_id": "ch1",
      "chapter_name": "Financial Statement Analysis",
      "topic_count": 1
    }
  ]
}
```

## 🏗️ Architecture

### Project Structure

```
learn-io-demo/
├── app/
│   ├── api/
│   │   ├── generate-mcq/
│   │   │   └── route.ts         # MCQ generation endpoint
│   │   └── chapter-summary/
│   │       └── route.ts         # Chapter summary endpoint
│   ├── mcq-demo/
│   │   └── page.tsx             # MCQ demo page
│   ├── chapter-summary/
│   │   └── page.tsx             # Chapter summary demo page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Home page
├── components/
│   ├── MCQDisplay.tsx           # MCQ display component
│   └── ChapterSummaryDisplay.tsx # Summary with keyword linking
├── lib/
│   ├── types.ts                 # TypeScript type definitions
│   ├── mockData.ts              # Mock question bank and PDF chunks
│   ├── openai.ts                # OpenAI client configuration
│   └── ragService.ts            # RAG search functions
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: OpenAI GPT-3.5-Turbo
- **Runtime**: Node.js 18+

### Key Design Decisions

1. **Pattern-Based Refresh Strategy**: Different prompts for different question types ensure appropriate modifications
2. **Stateless API Design**: Enables horizontal scaling and easy deployment
3. **Mock RAG Implementation**: Demonstrates production architecture without requiring actual vector database
4. **Component-Based UI**: Reusable React components for clean separation of concerns
5. **Client-Side Keyword Processing**: Efficient string manipulation avoids additional API calls

## 🎨 Demo Pages

### MCQ Generator Demo
Navigate to `/mcq-demo` to:
- Select topic and performance level
- Generate refreshed MCQs
- See pattern-specific modifications
- View detailed explanations
- Test answer selection

### Chapter Summary Demo
Navigate to `/chapter-summary` to:
- Select chapter to summarize
- Toggle RAG link pre-loading
- View comprehensive summaries
- Click keywords for definitions
- See RAG implementation flow

## 🧪 Testing the Features

### Test MCQ Generation

1. Navigate to `/mcq-demo`
2. Select "Financial Analysis" and "Beginner" level
3. Click "Generate Personalized MCQ"
4. Observe the refreshed question with new values
5. Try answering and see the explanation
6. Generate multiple questions to see variety

### Test Chapter Summary

1. Navigate to `/chapter-summary`
2. Select "Financial Statement Analysis"
3. Enable "Include RAG-powered keyword definitions"
4. Click "Generate Chapter Summary"
5. Read the comprehensive summary
6. Click on any highlighted keyword to see definition
7. Try clicking keywords from the legend below

### Test Different Patterns

The demo includes three question patterns:
- **Numerical Calculation**: Try "Financial Analysis" at any level
- **Scenario Analysis**: Try "Cost Accounting" at intermediate level
- **Pure Recall**: Look for questions asking "What is..." or "Why..."

## 💡 Prompt Engineering Details

### MCQ Refresh Prompts

Each pattern type has specialized instructions:

**Numerical Calculation**:
- Changes numerical values (amounts, percentages, dates)
- Preserves exact calculation logic and formulas
- Maintains similar number complexity
- Keeps same business context type

**Scenario Analysis**:
- Modifies context (company names, time periods, industry)
- Preserves core analytical concept
- Maintains decision framework
- Keeps same type of analysis (NPV, ROI, etc.)

**Pure Recall**:
- Rephrases question with different wording
- Tests same fundamental knowledge
- Maintains concept level
- Generates plausible distractors

### Chapter Summary Prompt

Key requirements:
- 400-600 word comprehensive yet simplified review
- Brief overview + main concepts + formulas + rules
- Student-focused language balancing accuracy and accessibility
- Explicit keyword identification (5-10 technical terms)
- Structured for easy scanning

## 🔄 RAG Implementation Flow

1. **Summary Generation**: OpenAI generates summary and identifies keywords
2. **Keyword Extraction**: Core technical terms are listed separately
3. **RAG Search**: Each keyword → `RAG_Search_Function(keyword)` → Vector DB query
4. **Frontend Linking**: Keywords highlighted and clickable
5. **Definition Display**: Click triggers tooltip with source material

### Production RAG Architecture

For production deployment:

1. **Vector Database**: Use Pinecone, Weaviate, or ChromaDB
2. **Embeddings**: Generate embeddings for PDF chunks using OpenAI `text-embedding-ada-002`
3. **Semantic Search**: Query by keyword embedding similarity
4. **Caching**: Cache frequent keyword definitions
5. **Chunking Strategy**: Optimal chunk size of 500-1000 tokens with overlap

## 📊 Cost Optimization

### Current Implementation

- **MCQ Generation**: ~500-800 tokens per request
- **Chapter Summary**: ~1200-1500 tokens per request
- **Model**: GPT-3.5-Turbo ($0.0015/1K input tokens, $0.002/1K output tokens)

### Estimated Costs (1000 students/day)

**MCQ Generation** (5 questions/student/day):
- 5000 requests × 1500 tokens avg = 7.5M tokens/day
- Cost: ~$15/day or $450/month

**Chapter Summaries** (2 summaries/student/week):
- ~570 requests × 2000 tokens avg = 1.14M tokens/day
- Cost: ~$3/day or $90/month

**Total**: ~$540/month for 1000 active daily users

### Cost Reduction Strategies

1. **Caching**: Cache common questions and summaries
2. **Batch Processing**: Generate multiple variations upfront
3. **Model Selection**: Use GPT-3.5 for routine, GPT-4 for complex
4. **Rate Limiting**: Implement user-based rate limits
5. **Pre-generation**: Generate popular content during off-peak hours

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add `OPENAI_API_KEY` in Vercel dashboard → Settings → Environment Variables

### Other Platforms

Works on any Node.js hosting:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## 🔐 Security Considerations

1. **API Key Protection**: Never commit `.env.local` to git
2. **Rate Limiting**: Implement rate limiting in production
3. **Input Validation**: Sanitize all user inputs
4. **Error Handling**: Don't expose internal errors to users
5. **CORS**: Configure proper CORS policies for API routes

## 📈 Future Enhancements

1. **User Authentication**: Add user accounts and progress tracking
2. **Performance Analytics**: Track user performance over time
3. **Adaptive Learning**: Adjust difficulty based on performance
4. **Real Vector Database**: Integrate Pinecone/Weaviate for production RAG
5. **PDF Upload**: Allow instructors to upload course materials
6. **Question Analytics**: Track which questions are most effective
7. **Mobile App**: React Native version for mobile learning
8. **Spaced Repetition**: Implement SRS algorithm for optimal review timing

## 🤝 Contributing

This is a demonstration project. For production use, consider:
- Adding comprehensive test coverage
- Implementing user authentication
- Setting up monitoring and logging
- Adding analytics and A/B testing
- Optimizing for scale

## 📝 License

MIT License - feel free to use this demo as a starting point for your own projects.

## 🙋 Support

For questions or issues:
1. Check the API documentation above
2. Review the implementation notes in demo pages
3. Examine the code comments in API routes
4. Check OpenAI API status if experiencing errors

## 🎓 Educational Value

This demo proves:
1. **MCQ Quality**: AI can maintain concept integrity while refreshing questions
2. **Summary Quality**: AI-generated summaries can serve as effective study tools
3. **RAG Feasibility**: Keyword linking enhances learning without overwhelming costs
4. **Scalability**: Architecture supports thousands of concurrent users
5. **Cost Effectiveness**: Reasonable costs for educational institutions

---

Built with ❤️ for the future of AI-powered education

