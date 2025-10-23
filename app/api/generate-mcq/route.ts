import { NextRequest, NextResponse } from 'next/server';
import { openai, validateOpenAIConfig } from '@/lib/openai';
import { questionBankData } from '@/lib/mockData';
import { Question, RefreshedMCQ, PerformanceLevel, PatternType } from '@/lib/types';
import { getCached, setCache } from '@/lib/simpleCache';

// Helper function to select a base question
function selectBaseQuestion(topicId: string, performanceLevel: PerformanceLevel): Question | null {
  // Filter questions by topic and difficulty level
  const matchingQuestions = questionBankData.filter(
    (q) => q.topic_id === topicId && q.difficulty_level === performanceLevel
  );

  if (matchingQuestions.length === 0) {
    // If no exact match, try to find questions from the same topic
    const topicQuestions = questionBankData.filter((q) => q.topic_id === topicId);
    return topicQuestions.length > 0 ? topicQuestions[0] : null;
  }

  // Return a random question from matching questions
  return matchingQuestions[Math.floor(Math.random() * matchingQuestions.length)];
}

// Generate prompt based on pattern type
function generateRefreshPrompt(question: Question): string {
  const baseInstruction = `You are an expert education content creator for CMA/CPA level accounting courses. Your task is to refresh the following question while maintaining its core concept, difficulty level, and learning objective.

Original Question: ${question.original_question}
Correct Answer: ${question.correct_answer}
Explanation: ${question.explanation}
Pattern Type: ${question.pattern_type}
Difficulty Level: ${question.difficulty_level}

`;

  let specificInstructions = '';

  switch (question.pattern_type) {
    case 'numerical_calculation':
      specificInstructions = `INSTRUCTIONS FOR NUMERICAL CALCULATION REFRESH:
1. CHANGE the numerical values (amounts, percentages, dates, quantities) to create a fresh scenario
2. PRESERVE the exact calculation logic, formula, and mathematical concept
3. Ensure the difficulty level remains the same (similar complexity of numbers)
4. Keep the same business context type (e.g., if it's about inventory, keep it about inventory)
5. Generate four plausible answer options (A, B, C, D) where only one is correct
6. The distractors should represent common calculation mistakes

Example: If the original uses "$50,000, $200,000, and $45,000", you might use "$75,000, $250,000, and $60,000"`;
      break;

    case 'scenario_analysis':
      specificInstructions = `INSTRUCTIONS FOR SCENARIO ANALYSIS REFRESH:
1. MODIFY the context details: company names, time periods, specific amounts, industry details
2. PRESERVE the core analytical concept, decision framework, and type of analysis required
3. Keep the same underlying business principle and decision-making logic
4. Ensure the complexity and cognitive load remain at the same level
5. Generate four answer options (A, B, C, D) that reflect the same type of decision outcomes
6. Maintain the same type of financial analysis tool (NPV, ROI, break-even, etc.)

Example: If the original is about "XYZ Corp investing in a production line", change to "ABC Industries considering a warehouse expansion"`;
      break;

    case 'pure_recall':
      specificInstructions = `INSTRUCTIONS FOR PURE RECALL REFRESH:
1. REPHRASE the question using different wording while asking about the same concept
2. MAINTAIN the same knowledge level and concept being tested
3. Keep the correct answer essentially the same but potentially reworded
4. Generate four answer options (A, B, C, D) with plausible distractors
5. Ensure the question still tests the same fundamental knowledge point

Example: If asking "What is the purpose of X?", rephrase to "Why is X used in accounting practice?"`;
      break;
  }

  return `${baseInstruction}${specificInstructions}

REQUIRED OUTPUT FORMAT (JSON):
{
  "question_text": "The refreshed question text",
  "options": {
    "A": "First option",
    "B": "Second option",
    "C": "Third option",
    "D": "Fourth option"
  },
  "correct_answer": "A" or "B" or "C" or "D",
  "explanation": "A detailed, didactic explanation that teaches the concept and shows step-by-step how to arrive at the correct answer. This should help students learn, not just verify the answer."
}

CRITICAL REQUIREMENTS:
- Maintain the same difficulty level: ${question.difficulty_level}
- Preserve the core learning objective
- Ensure the explanation is educational and thorough (3-5 sentences minimum)
- Make sure all four options are plausible but only one is correct
- For numerical questions, show the calculation steps in the explanation

Now generate the refreshed question:`;
}

export async function POST(request: NextRequest) {
  try {
    // Validate OpenAI configuration
    validateOpenAIConfig();

    // Parse request body
    const body = await request.json();
    const { topic_id, performance_level } = body;

    // Validate input
    if (!topic_id || !performance_level) {
      return NextResponse.json(
        { error: 'Missing required fields: topic_id and performance_level' },
        { status: 400 }
      );
    }

    // Validate performance level
    const validLevels: PerformanceLevel[] = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(performance_level)) {
      return NextResponse.json(
        { error: 'Invalid performance_level. Must be: beginner, intermediate, or advanced' },
        { status: 400 }
      );
    }

    // Select base question
    const baseQuestion = selectBaseQuestion(topic_id, performance_level);

    if (!baseQuestion) {
      return NextResponse.json(
        { error: `No questions found for topic: ${topic_id}` },
        { status: 404 }
      );
    }

    // Check cache first (saves 50-60% of API costs!)
    const cacheKey = `mcq:${topic_id}:${performance_level}:${baseQuestion.id}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return NextResponse.json({
        ...cached,
        from_cache: true,
        generated_at: cached.generated_at
      });
    }
    console.log('❌ Cache MISS:', cacheKey);

    // Generate refresh prompt
    const prompt = generateRefreshPrompt(baseQuestion);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert education content creator specializing in CMA/CPA level accounting courses. You generate high-quality, pedagogically sound questions and explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    // Parse the response
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    const refreshedMCQ: RefreshedMCQ = JSON.parse(responseContent);

    // Add metadata
    const response = {
      ...refreshedMCQ,
      pattern_type: baseQuestion.pattern_type,
      difficulty_level: baseQuestion.difficulty_level,
      topic_id: topic_id,
      base_question_id: baseQuestion.id,
      generated_at: new Date().toISOString(),
      from_cache: false,
    };

    // Cache for 1 hour (adjust TTL based on your needs)
    // Higher TTL = more savings, but less fresh content
    setCache(cacheKey, response, 3600); // 1 hour
    console.log('💾 Cached:', cacheKey);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error generating MCQ:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate MCQ', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available topics and levels
export async function GET() {
  try {
    // Extract unique topics and their difficulty levels
    const topics = questionBankData.reduce((acc, question) => {
      if (!acc[question.topic_id]) {
        acc[question.topic_id] = {
          topic_id: question.topic_id,
          available_levels: [],
          question_count: 0,
        };
      }
      
      if (!acc[question.topic_id].available_levels.includes(question.difficulty_level)) {
        acc[question.topic_id].available_levels.push(question.difficulty_level);
      }
      
      acc[question.topic_id].question_count++;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      topics: Object.values(topics),
      available_performance_levels: ['beginner', 'intermediate', 'advanced'],
    });
  } catch (error: any) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

