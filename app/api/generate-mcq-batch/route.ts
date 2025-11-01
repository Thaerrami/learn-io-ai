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
      pattern_type = 'scenario_analysis',
      question_count = 15, // Default to 15 questions
    } = await req.json();

    if (!topic_id || !original_question) {
      return NextResponse.json(
        { error: 'topic_id and original_question are required' },
        { status: 400 }
      );
    }

    // Validate question count
    const count = Math.min(Math.max(question_count, 5), 25); // Between 5-25 questions

    console.log(`🔍 Generating ${count} MCQ questions...`);

    // Get relevant context from ChromaDB
    const context = await searchContent(original_question, 5); // Get more context for batch generation
    
    // Get example questions from testbank
    const testbankExamples = await getTestbankExamples(topic_id, 3);

    // Build context for the prompt
    const contextText = context
      .map(c => `[${c.source}, Page ${c.page || 'N/A'}]: ${c.text}`)
      .join('\n\n');

    const examplesText = testbankExamples.length > 0
      ? `EXAMPLE QUESTIONS FROM TESTBANK:\n${testbankExamples.map(e => e.text).join('\n\n')}`
      : '';

    // Generate multiple MCQs using GPT-4 Turbo
    console.log('🤖 Generating batch MCQs with GPT-4...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert CMA/CPA exam question creator. Generate ${count} unique multiple-choice questions that:
1. Test understanding at the ${user_performance_level} level
2. Are based on the provided context and examples
3. Each has 4 options (A, B, C, D) with only one correct answer
4. Include detailed explanations with source references
5. Cover different aspects of the topic to ensure variety
6. Match the pattern type: ${pattern_type}

Return the response as a JSON array with ${count} questions in this format:
{
  "questions": [
    {
      "question_number": 1,
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
    }
  ]
}

IMPORTANT: Make each question unique and test different aspects of the topic. Vary the scenarios, calculations, and focus areas.`,
        },
        {
          role: 'user',
          content: `Generate ${count} ${user_performance_level} level questions based on:

TOPIC: ${topic_id}
ORIGINAL QUESTION: ${original_question}

CONTEXT FROM TEXTBOOK:
${contextText}

${examplesText}

Create ${count} diverse questions that test different aspects of this topic, ensuring variety in:
- Question scenarios and contexts
- Difficulty within the ${user_performance_level} level
- Focus areas (definitions, applications, calculations, analysis)
- Real-world examples and case studies

Each question should be unique and valuable for exam preparation.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 4000, // Increased for multiple questions
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"questions": []}');

    if (!result.questions || !Array.isArray(result.questions)) {
      throw new Error('Invalid response format from AI model');
    }

    // Add metadata to each question
    const questionsWithMetadata = result.questions.map((q: any, index: number) => ({
      ...q,
      question_number: index + 1,
      pattern_type: pattern_type,
      difficulty_level: user_performance_level,
      topic_id,
      generated_at: new Date().toISOString(),
      model_used: 'gpt-4-turbo-preview',
    }));

    // Add source information
    const sources = context.map(c => ({
      source: c.source,
      page: c.page,
      excerpt: c.text.substring(0, 150) + '...',
    }));

    return NextResponse.json({
      questions: questionsWithMetadata,
      total_questions: questionsWithMetadata.length,
      topic_id,
      difficulty_level: user_performance_level,
      pattern_type,
      sources,
      generated_at: new Date().toISOString(),
      model_used: 'gpt-4-turbo-preview',
    });

  } catch (error: any) {
    console.error('Error generating batch MCQs:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate batch MCQs',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
