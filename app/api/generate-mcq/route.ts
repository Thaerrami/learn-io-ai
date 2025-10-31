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
      correct_answer,
      user_performance_level = 'intermediate',
      pattern_type,
    } = await req.json();

    if (!topic_id || !original_question) {
      return NextResponse.json(
        { error: 'topic_id and original_question are required' },
        { status: 400 }
      );
    }

    // Get relevant context from ChromaDB
    console.log('🔍 Fetching context from ChromaDB...');
    const context = await searchContent(original_question, 3);
    
    // Get example questions from testbank
    const testbankExamples = await getTestbankExamples(topic_id, 2);

    // Build context for the prompt
    const contextText = context
      .map(c => `[${c.source}, Page ${c.page || 'N/A'}]: ${c.text}`)
      .join('\n\n');

    const examplesText = testbankExamples.length > 0
      ? `EXAMPLE QUESTIONS FROM TESTBANK:\n${testbankExamples.map(e => e.text).join('\n\n')}`
      : '';

    // Generate MCQ using GPT-4 Turbo (supports JSON mode)
    console.log('🤖 Generating MCQ with GPT-4...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert CMA/CPA exam question creator. Generate a multiple-choice question that:
1. Tests understanding at the ${user_performance_level} level
2. Is based on the provided context and examples
3. Has 4 options (A, B, C, D) with only one correct answer
4. Includes a detailed explanation with source references
5. Matches the pattern type: ${pattern_type || 'scenario_analysis'}

Return the response in this JSON format:
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
}`,
        },
        {
          role: 'user',
          content: `Generate a ${user_performance_level} level question based on:

ORIGINAL QUESTION: ${original_question}
${correct_answer ? `ORIGINAL ANSWER: ${correct_answer}` : ''}

CONTEXT FROM TEXTBOOK:
${contextText}

${examplesText}

Create a new question that tests the same concept but with different wording and scenarios, following the style of the testbank examples if provided.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    // Add source information
    const sources = context.map(c => ({
      source: c.source,
      page: c.page,
      excerpt: c.text.substring(0, 150) + '...',
    }));

    return NextResponse.json({
      ...result,
      pattern_type: pattern_type || 'scenario_analysis',
      difficulty_level: user_performance_level,
      topic_id,
      sources,
      generated_at: new Date().toISOString(),
      model_used: 'gpt-4-turbo-preview',
    });
  } catch (error: any) {
    console.error('Error generating MCQ:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate MCQ',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
