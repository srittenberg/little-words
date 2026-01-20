'use client';

import { useState, useRef, useEffect } from 'react';
import { Word } from '@/lib/types';

interface SoundboardProps {
  words: Word[];
}

export default function Soundboard({ words }: SoundboardProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    // Preload audio elements
    words.forEach((word) => {
      const audio = new Audio(word.src);
      audio.preload = 'auto';
      audioRefs.current.set(word.id, audio);
    });

    return () => {
      // Cleanup all audio elements
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
    };
  }, [words]);

  const handlePlay = (word: Word) => {
    // Stop any currently playing audio
    if (playingId) {
      const currentAudio = audioRefs.current.get(playingId);
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    const audio = audioRefs.current.get(word.id);
    if (audio) {
      audio.play();
      setPlayingId(word.id);

      audio.onended = () => {
        setPlayingId(null);
      };

      audio.onerror = () => {
        setPlayingId(null);
        console.error(`Error playing audio for ${word.label}`);
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-900 mb-2">
            Little Words
          </h1>
          <p className="text-amber-700 text-lg">Tap a word to hear it</p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {words.map((word) => {
            const isPlaying = playingId === word.id;
            return (
              <button
                key={word.id}
                onClick={() => handlePlay(word)}
                className={`
                  relative flex flex-col items-center justify-center
                  min-h-[120px] sm:min-h-[140px]
                  px-4 py-6
                  rounded-2xl sm:rounded-3xl
                  bg-white
                  border-2 transition-all duration-200
                  shadow-md hover:shadow-lg
                  active:scale-95
                  ${isPlaying 
                    ? 'border-amber-500 bg-amber-50 shadow-lg scale-95' 
                    : 'border-amber-200 hover:border-amber-300'
                  }
                `}
              >
                {word.emoji && (
                  <span className="text-4xl sm:text-5xl mb-2">
                    {word.emoji}
                  </span>
                )}
                <span className={`
                  text-base sm:text-lg font-semibold
                  ${isPlaying ? 'text-amber-700' : 'text-amber-900'}
                `}>
                  {word.label}
                </span>
                {isPlaying && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
