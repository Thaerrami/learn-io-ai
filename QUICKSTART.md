# Quick Start Guide

Get up and running with Learn.io in 5 minutes!

## Step 1: Install Dependencies (1 minute)

```bash
cd /Users/talazzeh/Desktop/development/learn-io-demo
npm install
```

## Step 2: Configure OpenAI API Key (1 minute)

1. Get your OpenAI API key from https://platform.openai.com/api-keys
2. Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

3. Edit `.env.local` and add your key:

```
OPENAI_API_KEY=sk-your-actual-key-here
```

## Step 3: Start the Development Server (30 seconds)

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Step 4: Try the Demos (2.5 minutes)

### MCQ Generator Demo

1. Navigate to http://localhost:3000/mcq-demo
2. Select a topic (e.g., "Financial Analysis")
3. Choose performance level (e.g., "Beginner")
4. Click "Generate Personalized MCQ"
5. Answer the question and see the explanation
6. Click "Next Question" to generate another

### Chapter Summary Demo

1. Navigate to http://localhost:3000/chapter-summary
2. Select a chapter (e.g., "Financial Statement Analysis")
3. Enable "Include RAG-powered keyword definitions"
4. Click "Generate Chapter Summary"
5. Wait 10-15 seconds for generation
6. Click any highlighted keyword to see its definition
7. Try clicking keywords from the legend below

## What You'll See

### MCQ Features
- ✅ Pattern-based question refreshing
- ✅ Difficulty level preservation
- ✅ Detailed educational explanations
- ✅ Interactive answer selection
- ✅ Immediate feedback

### Chapter Summary Features
- ✅ Comprehensive 400-600 word summaries
- ✅ Automatic keyword identification
- ✅ Clickable keyword links
- ✅ RAG-powered definitions
- ✅ Interactive tooltips

## Troubleshooting

### "Error: OPENAI_API_KEY is not configured"
- Make sure `.env.local` exists in the root directory
- Check that your API key is correct and active
- Restart the development server after adding the key

### "Failed to generate MCQ/Summary"
- Check your OpenAI API key balance
- Verify your internet connection
- Check OpenAI API status at https://status.openai.com

### Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

## Next Steps

1. **Read the Full Documentation**: Check out `README.md` for detailed information
2. **Explore the Code**: Start with `/app/api/generate-mcq/route.ts` and `/app/api/chapter-summary/route.ts`
3. **Try API Examples**: Use the examples in `API_EXAMPLES.md` to test endpoints directly
4. **Customize Mock Data**: Edit `/lib/mockData.ts` to add your own questions and content
5. **Deploy**: When ready, deploy to Vercel with `vercel --prod`

## Quick API Testing

Test the APIs directly using curl:

```bash
# Generate MCQ
curl -X POST http://localhost:3000/api/generate-mcq \
  -H "Content-Type: application/json" \
  -d '{"topic_id": "financial-analysis", "performance_level": "beginner"}'

# Generate Summary
curl -X POST http://localhost:3000/api/chapter-summary \
  -H "Content-Type: application/json" \
  -d '{"chapter_name": "Financial Statement Analysis", "include_rag_links": true}'
```

## Development Tips

- **Hot Reload**: Changes to files automatically reload the browser
- **TypeScript**: Full type safety throughout the project
- **Tailwind CSS**: Utility-first styling for rapid UI development
- **Mock Data**: All data is in `/lib/mockData.ts` for easy modification

## Cost Monitoring

With GPT-3.5-Turbo:
- MCQ Generation: ~$0.003 per question
- Chapter Summary: ~$0.006 per summary

For 100 test generations, expect costs under $1.

Enjoy building with Learn.io! 🚀

