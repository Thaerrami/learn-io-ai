import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { searchContent, getTestbankExamples } from '@/lib/ragService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const {
      topic_id,
      original_question,
      user_performance_level = 'intermediate',
      pattern_type,
      question_count = 20,
    } = await req.json();

    if (!topic_id || !original_question) {
      return NextResponse.json(
        { error: 'topic_id and original_question are required' },
        { status: 400 }
      );
    }

    // Get relevant context from ChromaDB
    console.log('🔍 Fetching context from ChromaDB...');
    const context = await searchContent(original_question, 5);
    
    // Get example questions from testbank
    const testbankExamples = await getTestbankExamples(topic_id, 5);

    // Build context for the prompt
    const contextText = context
      .map(c => `[${c.source}, Page ${c.page || 'N/A'}]: ${c.text}`)
      .join('\n\n');

    const examplesText = testbankExamples.length > 0
      ? `EXAMPLE QUESTIONS FROM TESTBANK:\n${testbankExamples.map(e => e.text).join('\n\n')}`
      : '';

    // Generate multiple MCQs using GPT-4 Turbo
    console.log(`🤖 Generating ${question_count} MCQs with GPT-4...`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert CMA/CPA exam question creator. Generate ${question_count} multiple-choice questions that:
1. Test understanding at the ${user_performance_level} level
2. Are based on the provided context and examples
3. Each has 4 options (A, B, C, D) with only one correct answer
4. Include detailed explanations with source references
5. Match the pattern type: ${pattern_type || 'scenario_analysis'}
6. Cover different aspects and concepts from the topic
7. Vary in difficulty within the ${user_performance_level} level

Return the response in this JSON format:
{
  "questions": [
    {
      "question_text": "The question text",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correct_answer": "A",
      "explanation": "Detailed explanation with source references",
      "source_page": 10
    },
    ... (${question_count} total questions)
  ]
}`,
        },
        {
          role: 'user',
          content: `Generate ${question_count} ${user_performance_level} level questions based on:

TOPIC: ${topic_id}
ORIGINAL QUESTION: ${original_question}

CONTEXT FROM TEXTBOOK:
${contextText}

${examplesText}

Create ${question_count} diverse questions that test different aspects of this topic, following the style of the testbank examples if provided. Ensure variety in scenarios, calculations, and concepts.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Ensure we have questions array
    if (!result.questions || !Array.isArray(result.questions)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Add source information to each question
    const sources = context.map(c => ({
      source: c.source,
      page: c.page,
      excerpt: c.text.substring(0, 150) + '...',
    }));

    const questions = result.questions.map((q: any) => ({
      ...q,
      pattern_type: pattern_type || 'scenario_analysis',
      difficulty_level: user_performance_level,
      topic_id,
      sources,
      generated_at: new Date().toISOString(),
      model_used: 'gpt-4-turbo-preview',
    }));

    return NextResponse.json({
      questions,
      total: questions.length,
      topic_id,
      difficulty_level: user_performance_level,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating exam:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate exam',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

