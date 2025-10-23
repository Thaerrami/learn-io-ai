import { NextRequest, NextResponse } from 'next/server';
import { openai, validateOpenAIConfig } from '@/lib/openai';
import { mockChapters } from '@/lib/mockData';
import { batchRAGSearch } from '@/lib/ragService';
import { ChapterSummary } from '@/lib/types';
import { getCached, setCache } from '@/lib/simpleCache';

// Generate comprehensive prompt for chapter abstraction
function generateChapterAbstractionPrompt(chapterName: string): string {
  return `You are an expert educational content creator specializing in CMA/CPA level accounting and finance courses. Your task is to create a comprehensive yet simplified chapter summary for university and professional certification students.

Chapter Name: "${chapterName}"

YOUR TASK:
Create a review/revision summary that helps students quickly understand and recall the key concepts from this chapter. The summary should be thorough enough to serve as a study guide but concise enough to be reviewed in 10-15 minutes.

REQUIREMENTS FOR THE SUMMARY:
1. Start with a brief overview of what the chapter covers (2-3 sentences)
2. Break down the main concepts into clear sections
3. Explain each concept briefly but clearly - aim for understanding, not just listing
4. Include the most important formulas with brief explanations of when to use them
5. Highlight key rules, principles, or frameworks
6. Use bullet points and clear structure for easy scanning
7. Write at a level that balances technical accuracy with accessibility
8. Length: 400-600 words

REQUIREMENTS FOR KEYWORDS:
After generating the summary, identify 5-10 "Core Keywords" that represent the most important terms and concepts in the summary. These should be:
- Technical terms that students need to understand deeply
- Concepts that have formal definitions
- Terms that appear in formulas or frameworks
- Words that, if clicked, would benefit from seeing the original textbook definition

Examples of good keywords: "Net Present Value", "Cost of Goods Sold", "Variable Cost", "Overhead Rate"
Examples of poor keywords: "important", "calculate", "understand", "business"

OUTPUT FORMAT (JSON):
{
  "summary_text": "Your comprehensive summary here...",
  "core_keywords": ["Keyword 1", "Keyword 2", "Keyword 3", "Keyword 4", "Keyword 5", ...]
}

IMPORTANT: 
- Write the summary as if you're a teaching assistant helping students review before an exam
- Focus on understanding and application, not just memorization
- Make it practical and useful for active study
- Ensure keywords are actual terms that appear in the summary text

Generate the chapter summary now:`;
}

export async function POST(request: NextRequest) {
  try {
    // Validate OpenAI configuration
    validateOpenAIConfig();

    // Parse request body
    const body = await request.json();
    const { chapter_name, include_rag_links = false } = body;

    // Validate input
    if (!chapter_name) {
      return NextResponse.json(
        { error: 'Missing required field: chapter_name' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `summary:${chapter_name.toLowerCase()}:${include_rag_links}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return NextResponse.json({
        ...cached,
        from_cache: true,
      });
    }
    console.log('❌ Cache MISS:', cacheKey);

    // Check if chapter exists in our mock data
    const chapter = mockChapters.find(
      (ch) => ch.chapter_name.toLowerCase() === chapter_name.toLowerCase()
    );

    if (!chapter) {
      // Even if not in mock data, we can still generate a summary
      console.log(`Chapter "${chapter_name}" not in mock data, but proceeding with generation`);
    }

    // Generate chapter abstraction prompt
    const prompt = generateChapterAbstractionPrompt(chapter_name);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert education content creator specializing in CMA/CPA level accounting and finance. You create clear, comprehensive summaries that help students review and understand complex topics.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    // Parse the response
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    const parsedResponse: ChapterSummary = JSON.parse(responseContent);

    // Build the response object
    const response: any = {
      chapter_name,
      summary_text: parsedResponse.summary_text,
      core_keywords: parsedResponse.core_keywords,
      generated_at: new Date().toISOString(),
      from_cache: false,
    };

    // If RAG links are requested, fetch definitions for keywords
    if (include_rag_links) {
      console.log('Fetching RAG definitions for keywords:', parsedResponse.core_keywords);
      const ragResults = batchRAGSearch(parsedResponse.core_keywords);
      response.rag_definitions = ragResults;
    }

    // Cache for 24 hours (summaries change less frequently)
    setCache(cacheKey, response, 24 * 3600);
    console.log('💾 Cached:', cacheKey);

    return NextResponse.json(response, { status: 200 });
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

// GET endpoint to retrieve available chapters
export async function GET() {
  try {
    return NextResponse.json({
      available_chapters: mockChapters.map((ch) => ({
        chapter_id: ch.chapter_id,
        chapter_name: ch.chapter_name,
        topic_count: ch.topic_ids.length,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}

