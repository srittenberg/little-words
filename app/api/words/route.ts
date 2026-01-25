import { list, head } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { Word } from '@/lib/types';

// Fallback to local data during development or if blob is not configured
async function getLocalWords(): Promise<Word[]> {
  const wordsData = await import('@/data/words.json');
  return wordsData.default as Word[];
}

export async function GET() {
  try {
    // Check if we have a blob token configured
    if (!process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN === 'your_token_here') {
      // Fallback to local data
      const words = await getLocalWords();
      return NextResponse.json(words);
    }

    // Try to get words.json from Vercel Blob
    const { blobs } = await list({ prefix: 'words.json' });
    
    if (blobs.length === 0) {
      // No words.json in blob yet, return local data
      const words = await getLocalWords();
      return NextResponse.json(words);
    }

    // Fetch the words.json from blob
    const wordsBlob = blobs[0];
    const response = await fetch(wordsBlob.url);
    const words = await response.json();
    
    return NextResponse.json(words);
  } catch (error) {
    console.error('Error fetching words:', error);
    // Fallback to local data on error
    try {
      const words = await getLocalWords();
      return NextResponse.json(words);
    } catch {
      return NextResponse.json([], { status: 500 });
    }
  }
}
