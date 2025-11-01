import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getChapterContext, RAG_Search_Function } from '@/lib/ragService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { chapter_name, core_keywords } = await req.json();

    if (!chapter_name || !core_keywords || !Array.isArray(core_keywords)) {
      return NextResponse.json(
        { error: 'chapter_name and core_keywords (array) are required' },
        { status: 400 }
      );
    }

    // Get context from ChromaDB using RAG
    console.log('🔍 Fetching context from ChromaDB...');
    const context = await getChapterContext(chapter_name, core_keywords);

    // Get keyword definitions
    const keywordDefinitions = await Promise.all(
      core_keywords.map(keyword => RAG_Search_Function(keyword))
    );

    // Build context for the prompt
    const contextText = context
      .map(c => `[From ${c.source}, Page ${c.page || 'N/A'}]: ${c.text}`)
      .join('\n\n');

    const keywordText = keywordDefinitions
      .map(def => `${def.keyword}: ${def.relevant_chunks.join(' ')} (Source: Page ${def.source_page || 'N/A'})`)
      .join('\n\n');

    // Generate summary using GPT-4 Turbo
    console.log('🤖 Generating summary with GPT-4...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert educational content creator. Generate a comprehensive chapter summary that:
1. Provides a clear overview of the chapter's main concepts
2. Defines and explains the core keywords
3. Uses information from the provided context
4. Cites sources with page numbers when available
5. Is suitable for students preparing for CMA/CPA exams`,
        },
        {
          role: 'user',
          content: `Create a summary for "${chapter_name}" focusing on these keywords: ${core_keywords.join(', ')}

CONTEXT FROM TEXTBOOK:
${contextText}

KEYWORD DEFINITIONS:
${keywordText}

Generate a well-structured summary that incorporates this information and helps students understand the key concepts.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const summaryText = completion.choices[0].message.content || '';

    // Create source citations
    const sources = context.map(c => ({
      source: c.source,
      page: c.page,
      excerpt: c.text.substring(0, 150) + '...',
    }));

    return NextResponse.json({
      chapter_name,
      summary_text: summaryText,
      core_keywords,
      sources,
      generated_at: new Date().toISOString(),
      model_used: 'gpt-4-turbo-preview',
    });
  } catch (error: any) {
    console.error('Error generating chapter summary:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate chapter summary',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
