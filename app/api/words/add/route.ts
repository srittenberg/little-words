import { put, list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { Word } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Check if blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN === 'your_token_here') {
      return NextResponse.json(
        { error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const label = formData.get('label') as string | null;
    const emoji = formData.get('emoji') as string | null;

    // Validate required fields
    if (!audioFile || !label || !emoji) {
      return NextResponse.json(
        { error: 'Missing required fields: audio, label, and emoji are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/m4a'];
    if (!allowedTypes.some(type => audioFile.type.includes(type.split('/')[1]))) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: .m4a, .mp3, .wav' },
        { status: 400 }
      );
    }

    // Generate a unique ID from the label
    const id = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Determine file extension
    const extension = audioFile.name.split('.').pop() || 'm4a';
    const audioFileName = `audio/${label}.${extension}`;

    // Upload audio file to blob
    const audioBlob = await put(audioFileName, audioFile, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Create the new word entry
    const newWord: Word = {
      id,
      label,
      emoji,
      src: audioBlob.url,
    };

    // Get existing words from blob or create empty array
    let words: Word[] = [];
    try {
      const { blobs } = await list({ prefix: 'words.json' });
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url);
        words = await response.json();
      }
    } catch {
      // If words.json doesn't exist, start with empty array
      words = [];
    }

    // Check for duplicate ID
    if (words.some(w => w.id === id)) {
      return NextResponse.json(
        { error: 'A word with this name already exists' },
        { status: 400 }
      );
    }

    // Add new word
    words.push(newWord);

    // Save updated words.json to blob
    await put('words.json', JSON.stringify(words, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });

    return NextResponse.json({ success: true, word: newWord });
  } catch (error) {
    console.error('Error adding word:', error);
    return NextResponse.json(
      { error: 'Failed to add word' },
      { status: 500 }
    );
  }
}
