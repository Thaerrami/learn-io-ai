# API Examples

This document provides ready-to-use examples for testing the Learn.io API endpoints.

## MCQ Generation API

### Example 1: Beginner Financial Analysis Question

```bash
curl -X POST http://localhost:3000/api/generate-mcq \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "financial-analysis",
    "performance_level": "beginner"
  }'
```

### Example 2: Intermediate Cost Accounting Question

```bash
curl -X POST http://localhost:3000/api/generate-mcq \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "cost-accounting",
    "performance_level": "intermediate"
  }'
```

### Example 3: Get Available Topics

```bash
curl http://localhost:3000/api/generate-mcq
```

## Chapter Summary API

### Example 1: Financial Statement Analysis

```bash
curl -X POST http://localhost:3000/api/chapter-summary \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_name": "Financial Statement Analysis",
    "include_rag_links": true
  }'
```

### Example 2: Cost Accounting Fundamentals

```bash
curl -X POST http://localhost:3000/api/chapter-summary \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_name": "Cost Accounting Fundamentals",
    "include_rag_links": false
  }'
```

### Example 3: Get Available Chapters

```bash
curl http://localhost:3000/api/chapter-summary
```

## JavaScript/Fetch Examples

### Generate MCQ from Frontend

```javascript
async function generateMCQ() {
  const response = await fetch('/api/generate-mcq', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic_id: 'financial-analysis',
      performance_level: 'beginner'
    })
  });
  
  const data = await response.json();
  console.log('Generated MCQ:', data);
  return data;
}
```

### Generate Chapter Summary from Frontend

```javascript
async function generateSummary() {
  const response = await fetch('/api/chapter-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chapter_name: 'Financial Statement Analysis',
      include_rag_links: true
    })
  });
  
  const data = await response.json();
  console.log('Generated Summary:', data);
  return data;
}
```

## Python Examples

### Using Requests Library

```python
import requests
import json

# Generate MCQ
response = requests.post(
    'http://localhost:3000/api/generate-mcq',
    json={
        'topic_id': 'financial-analysis',
        'performance_level': 'beginner'
    }
)
mcq = response.json()
print(json.dumps(mcq, indent=2))

# Generate Chapter Summary
response = requests.post(
    'http://localhost:3000/api/chapter-summary',
    json={
        'chapter_name': 'Financial Statement Analysis',
        'include_rag_links': True
    }
)
summary = response.json()
print(json.dumps(summary, indent=2))
```

## Response Examples

### MCQ Response

```json
{
  "question_text": "A company has a beginning inventory of $75,000, purchases of $250,000, and an ending inventory of $60,000. What is the cost of goods sold?",
  "options": {
    "A": "$235,000",
    "B": "$265,000",
    "C": "$275,000",
    "D": "$325,000"
  },
  "correct_answer": "B",
  "explanation": "Cost of Goods Sold (COGS) is calculated using the formula: Beginning Inventory + Purchases - Ending Inventory. In this case: $75,000 + $250,000 - $60,000 = $265,000. This formula represents the total cost of inventory that was available during the period minus what remains at the end, giving us the cost of what was actually sold.",
  "pattern_type": "numerical_calculation",
  "difficulty_level": "beginner",
  "topic_id": "financial-analysis",
  "base_question_id": "q1",
  "generated_at": "2025-10-23T12:34:56.789Z"
}
```

### Chapter Summary Response

```json
{
  "chapter_name": "Financial Statement Analysis",
  "summary_text": "Financial Statement Analysis is a critical skill for accountants, financial analysts, and business professionals. This chapter covers the fundamental techniques and tools used to evaluate a company's financial health and performance...\n\n**Key Concepts:**\n- Horizontal Analysis: Comparing financial data across multiple periods to identify trends\n- Vertical Analysis: Expressing each line item as a percentage of a base figure\n- Ratio Analysis: Using mathematical relationships to assess liquidity, profitability, and efficiency\n\n**Important Formulas:**\n- Current Ratio = Current Assets / Current Liabilities\n- Return on Assets (ROA) = Net Income / Total Assets\n- Debt-to-Equity Ratio = Total Liabilities / Shareholders' Equity\n\n**Key Principles:**\n1. Always compare ratios to industry benchmarks and historical performance\n2. Consider both quantitative metrics and qualitative factors\n3. Look for trends rather than single-period snapshots\n4. Understand the limitations of financial statement analysis",
  "core_keywords": [
    "Horizontal Analysis",
    "Vertical Analysis",
    "Ratio Analysis",
    "Current Ratio",
    "Return on Assets",
    "Debt-to-Equity Ratio",
    "Liquidity",
    "Profitability"
  ],
  "generated_at": "2025-10-23T12:35:00.000Z",
  "rag_definitions": {
    "Current Ratio": {
      "keyword": "Current Ratio",
      "relevant_chunks": [
        "The Current Ratio is a liquidity ratio that measures a company's ability to pay short-term obligations...",
        "Formula: Current Ratio = Current Assets / Current Liabilities...",
        "A ratio above 1.0 indicates the company has more current assets than current liabilities..."
      ],
      "source_page": 125
    }
  }
}
```

## Error Handling

### Invalid Performance Level

```bash
curl -X POST http://localhost:3000/api/generate-mcq \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "financial-analysis",
    "performance_level": "expert"
  }'
```

Response:
```json
{
  "error": "Invalid performance_level. Must be: beginner, intermediate, or advanced"
}
```

### Missing Parameters

```bash
curl -X POST http://localhost:3000/api/chapter-summary \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:
```json
{
  "error": "Missing required field: chapter_name"
}
```

## Rate Limiting (Production)

For production deployments, consider implementing rate limiting:

```javascript
// Example rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply to API routes
app.use('/api/', limiter);
```

## Integration Examples

### React Component

```typescript
import { useState } from 'react';

export function MCQGenerator() {
  const [mcq, setMcq] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: 'financial-analysis',
          performance_level: 'beginner'
        })
      });
      const data = await response.json();
      setMcq(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate MCQ'}
      </button>
      {mcq && (
        <div>
          <h3>{mcq.question_text}</h3>
          {/* Render options and explanation */}
        </div>
      )}
    </div>
  );
}
```

### Node.js Backend Integration

```javascript
const axios = require('axios');

async function enrichStudentProfile(studentId) {
  // Generate personalized questions
  const mcqs = [];
  for (let i = 0; i < 5; i++) {
    const response = await axios.post('http://localhost:3000/api/generate-mcq', {
      topic_id: 'financial-analysis',
      performance_level: 'beginner'
    });
    mcqs.push(response.data);
  }
  
  // Store in database
  await db.studentQuestions.insertMany({
    student_id: studentId,
    questions: mcqs,
    generated_at: new Date()
  });
}
```

