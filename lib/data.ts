import { Word } from './types';
import wordsData from '../data/words.json';

// Server-side: Get words from local data (fallback for initial render)
export function getWordsSync(): Word[] {
  const words = wordsData as Word[];
  // Sort alphabetically by label
  return [...words].sort((a, b) => a.label.localeCompare(b.label));
}

// Client-side: Fetch words from API (supports dynamic updates)
export async function fetchWords(): Promise<Word[]> {
  const res = await fetch('/api/words');
  if (!res.ok) {
    throw new Error('Failed to fetch words');
  }
  const words: Word[] = await res.json();
  // Sort alphabetically by label
  return [...words].sort((a, b) => a.label.localeCompare(b.label));
}

// Legacy export for backwards compatibility
export const getWords = getWordsSync;
