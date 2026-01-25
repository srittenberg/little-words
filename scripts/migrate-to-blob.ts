/**
 * Migration script to upload existing words and audio files to Vercel Blob
 * 
 * Usage:
 *   1. Set BLOB_READ_WRITE_TOKEN in .env.local
 *   2. Run: npm run migrate
 */

import { config } from 'dotenv';
import { put, list } from '@vercel/blob';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: '.env.local' });

interface Word {
  id: string;
  label: string;
  emoji: string;
  src: string;
}

async function migrate() {
  console.log('Starting migration to Vercel Blob...\n');

  // Check for token
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Error: BLOB_READ_WRITE_TOKEN not set in environment');
    console.log('Please set it in .env.local and try again');
    process.exit(1);
  }

  // Load existing words
  const wordsPath = join(process.cwd(), 'data', 'words.json');
  const wordsData = JSON.parse(readFileSync(wordsPath, 'utf-8')) as Word[];
  console.log(`Found ${wordsData.length} words to migrate\n`);

  // Upload audio files and update URLs
  const audioDir = join(process.cwd(), 'public', 'audio');
  const audioFiles = readdirSync(audioDir);
  const updatedWords: Word[] = [];

  for (const word of wordsData) {
    // Extract filename from src path (e.g., "/audio/Avocado.m4a" -> "Avocado.m4a")
    const filename = word.src.split('/').pop()!;
    const audioPath = join(audioDir, filename);

    try {
      console.log(`Uploading: ${filename}...`);
      const audioBuffer = readFileSync(audioPath);
      
      const blob = await put(`audio/${filename}`, audioBuffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'audio/mp4',
      });

      updatedWords.push({
        ...word,
        src: blob.url,
      });
      console.log(`  ✓ Uploaded to: ${blob.url}`);
    } catch (error) {
      console.error(`  ✗ Failed to upload ${filename}:`, error);
      process.exit(1);
    }
  }

  // Upload updated words.json
  console.log('\nUploading words.json...');
  try {
    const wordsBlob = await put('words.json', JSON.stringify(updatedWords, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    console.log(`  ✓ Uploaded words.json to: ${wordsBlob.url}`);
  } catch (error) {
    console.error('  ✗ Failed to upload words.json:', error);
    process.exit(1);
  }

  console.log('\n✅ Migration complete!');
  console.log(`   Migrated ${updatedWords.length} words and audio files to Vercel Blob`);
}

migrate().catch(console.error);
