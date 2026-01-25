'use client';

import { useState, useEffect, useCallback } from 'react';
import Soundboard from './Soundboard';
import { Word } from '@/lib/types';
import { fetchWords } from '@/lib/data';

interface SoundboardWithDataProps {
  initialWords: Word[];
}

export default function SoundboardWithData({ initialWords }: SoundboardWithDataProps) {
  const [words, setWords] = useState<Word[]>(initialWords);
  const [isLoading, setIsLoading] = useState(false);

  const refreshWords = useCallback(async () => {
    setIsLoading(true);
    try {
      const freshWords = await fetchWords();
      setWords(freshWords);
    } catch (error) {
      console.error('Failed to fetch words:', error);
      // Keep using current words on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch words from API on mount to get latest data
  useEffect(() => {
    refreshWords();
  }, [refreshWords]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute top-4 right-4 z-40">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-amber-600 text-sm">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </div>
        </div>
      )}
      <Soundboard words={words} onRefresh={refreshWords} />
    </div>
  );
}
