import { NextRequest, NextResponse } from 'next/server';
import { initChromaDB, getCollectionStats } from '@/lib/chromaService';

/**
 * API endpoint to check ChromaDB status
 */
export async function GET() {
  try {
    await initChromaDB();
    const stats = await getCollectionStats();
    
    return NextResponse.json({
      status: 'connected',
      ...stats,
      message: 'ChromaDB is ready',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to ChromaDB',
        error: error.message,
        hint: 'Make sure ChromaDB is running: docker run -p 8000:8000 chromadb/chroma',
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to trigger PDF ingestion
 * Note: In production, this should be a background job
 */
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (action === 'check-status') {
      await initChromaDB();
      const stats = await getCollectionStats();
      
      return NextResponse.json({
        status: 'connected',
        ...stats,
      });
    }

    return NextResponse.json(
      {
        message: 'To ingest PDFs, run: npx ts-node scripts/ingestPDFs.ts',
        note: 'PDF ingestion should be done as a background process, not through the API',
      },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error.message,
      },
      { status: 500 }
    );
  }
}


