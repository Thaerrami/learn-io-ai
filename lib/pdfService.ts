/**
 * PDF Processing Service
 * Extracts text from PDFs and chunks them for RAG
 */

import pdf from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';

export interface PDFChunk {
  text: string;
  page: number;
  chunkIndex: number;
  source: string;
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPDF(pdfPath: string): Promise<{
  text: string;
  pages: string[];
  numPages: number;
}> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);

    return {
      text: data.text,
      pages: data.text.split('\n\n'), // Simple page splitting
      numPages: data.numpages,
    };
  } catch (error) {
    console.error(`Error extracting PDF from ${pdfPath}:`, error);
    throw error;
  }
}

/**
 * Chunk text into smaller pieces for better semantic search
 * Uses sentence-based chunking with overlap
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Add overlap by keeping last few words
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Process PDF and create chunks with metadata
 */
export async function processPDF(
  pdfPath: string,
  sourceName?: string
): Promise<PDFChunk[]> {
  const fileName = sourceName || path.basename(pdfPath);
  const { text, numPages } = await extractTextFromPDF(pdfPath);

  // Split text into chunks
  const chunks = chunkText(text, 500, 50);

  // Create chunks with metadata
  const pdfChunks: PDFChunk[] = chunks.map((chunk, index) => ({
    text: chunk,
    page: Math.floor((index / chunks.length) * numPages) + 1,
    chunkIndex: index,
    source: fileName,
  }));

  return pdfChunks;
}

/**
 * Extract questions from testbank PDF
 * Assumes format: Question text followed by options and answer
 */
export function extractQuestionsFromText(text: string): Array<{
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
}> {
  const questions: Array<{
    question: string;
    options?: string[];
    answer?: string;
    explanation?: string;
  }> = [];

  // Split by common question patterns
  const questionBlocks = text.split(/\n\s*\d+\.\s+/).filter(block => block.trim().length > 0);

  for (const block of questionBlocks) {
    const lines = block.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) continue;

    const question = lines[0].trim();
    const options: string[] = [];
    let answer = '';
    let explanation = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if it's an option (A., B., C., D. or a), b), c), d))
      if (/^[A-D][\.)]\s+/.test(line)) {
        options.push(line);
      } else if (line.toLowerCase().startsWith('answer:')) {
        answer = line.replace(/answer:/i, '').trim();
      } else if (line.toLowerCase().startsWith('explanation:')) {
        explanation = line.replace(/explanation:/i, '').trim();
      }
    }

    questions.push({
      question,
      options: options.length > 0 ? options : undefined,
      answer: answer || undefined,
      explanation: explanation || undefined,
    });
  }

  return questions;
}


