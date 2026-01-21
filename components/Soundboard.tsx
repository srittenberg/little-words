'use client';

import { useState, useRef, useEffect } from 'react';
import { Word } from '@/lib/types';

interface SoundboardProps {
  words: Word[];
}

// Deterministic card variation based on index
function getCardVariation(index: number) {
  // Rotation: cycles through -1deg, 0deg, +1deg
  const rotation = (index % 3 - 1) * 1; // -1, 0, or 1 degrees
  
  // Vertical offset: subtle variation using a different pattern
  const offset = (index % 5 - 2) * 0.5; // -1px, -0.5px, 0px, 0.5px, or 1px
  
  return { rotation, offset };
}

interface Sparkle {
  id: string;
  x: number;
  y: number;
}

export default function Soundboard({ words }: SoundboardProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [tappedId, setTappedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sparkles, setSparkles] = useState<Map<string, Sparkle[]>>(new Map());
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

  const handlePlay = (word: Word, showSparkles = true) => {
    // Trigger tap animation
    setTappedId(word.id);
    setTimeout(() => setTappedId(null), 200);

    // Trigger sparkle burst
    if (showSparkles) {
      const sparkleCount = 3; // 2-4 sparkles
      const newSparkles: Sparkle[] = [];
      for (let i = 0; i < sparkleCount; i++) {
        // Random position near emoji area (roughly -20px to +20px from center)
        const angle = (Math.PI * 2 * i) / sparkleCount + Math.random() * 0.5;
        const distance = 15 + Math.random() * 10;
        newSparkles.push({
          id: `${word.id}-${i}-${Date.now()}`,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
        });
      }
      setSparkles((prev) => {
        const next = new Map(prev);
        next.set(word.id, newSparkles);
        return next;
      });
      // Remove sparkles after animation
      setTimeout(() => {
        setSparkles((prev) => {
          const next = new Map(prev);
          next.delete(word.id);
          return next;
        });
      }, 700);
    }

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

  const handleShuffle = () => {
    if (words.length === 0) return;
    const randomWord = words[Math.floor(Math.random() * words.length)];
    handlePlay(randomWord, true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 sm:mb-12">
          {/* Header layout: stacked on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 sm:gap-8">
            {/* Title + Subtitle block */}
            <div className="flex flex-col items-center sm:items-start">
              {/* Title as clean text with sparkle cluster */}
              <h1 className="text-4xl sm:text-5xl font-bold text-amber-900 leading-tight">
                little words
                <span className="ml-1.5 text-amber-300 text-xl sm:text-2xl">✦</span>
                <span className="text-amber-200 text-sm sm:text-base">✧</span>
              </h1>
              
              {/* Subtitle */}
              <p className="mt-2 text-amber-700/60 text-base sm:text-lg italic font-light">
                tiny sounds, big memories
              </p>
            </div>
            
            {/* Shuffle chip */}
            <div className="flex justify-center sm:justify-end sm:pt-2">
              <button
                onClick={handleShuffle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-amber-700 text-sm font-medium rounded-full border border-amber-200/80 bg-white/60 hover:bg-amber-50 hover:border-amber-300 transition-colors duration-200 active:scale-95"
              >
                <span className="text-base">✨</span>
                <span>shuffle</span>
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {words.map((word, index) => {
            const isPlaying = playingId === word.id;
            const isTapped = tappedId === word.id;
            const isHovered = hoveredId === word.id;
            const { rotation, offset } = getCardVariation(index);
            const scale = isTapped ? 0.94 : (isHovered ? 1.05 : 1);
            // Add fun rotation on tap - alternate direction based on index for variety
            const tapRotation = isTapped ? (index % 2 === 0 ? 8 : -8) : 0;
            const totalRotation = rotation + tapRotation;
            const hoverLift = isHovered ? -4 : 0;
            const wordSparkles = sparkles.get(word.id) || [];
            return (
              <button
                key={word.id}
                onClick={() => handlePlay(word)}
                onMouseEnter={() => setHoveredId(word.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  transform: `rotate(${totalRotation}deg) translateY(${offset + hoverLift}px) scale(${scale})`,
                  transformOrigin: 'center',
                }}
                className={`
                  relative flex flex-col items-center justify-center
                  min-h-[120px] sm:min-h-[140px]
                  px-4 py-6
                  rounded-2xl sm:rounded-3xl
                  bg-white
                  border-2
                  shadow-md hover:shadow-lg hover:shadow-amber-200/40
                  transition-all duration-300 ease-out
                  ${isPlaying 
                    ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-200/50 glow-pulse' 
                    : 'border-amber-200 hover:border-amber-300'
                  }
                `}
              >
                {word.emoji && (
                  <div className="relative mb-2 inline-block">
                    {/* Sticker background */}
                    <div 
                      className="absolute rounded-full bg-amber-200/60 blur-sm opacity-90"
                      style={{
                        top: '-8px',
                        left: '-8px',
                        right: '-8px',
                        bottom: '-8px',
                      }}
                    />
                    <div 
                      className="absolute rounded-full bg-amber-100/80"
                      style={{
                        top: '-4px',
                        left: '-4px',
                        right: '-4px',
                        bottom: '-4px',
                      }}
                    />
                    {/* Emoji with pop effect when playing */}
                    <span 
                      className="relative text-4xl sm:text-5xl block transition-transform duration-300 ease-out"
                      style={{
                        transform: isPlaying ? 'scale(1.06)' : 'scale(1)',
                      }}
                    >
                      {word.emoji}
                    </span>
                    {/* Sparkle burst overlay */}
                    {wordSparkles.map((sparkle) => (
                      <span
                        key={sparkle.id}
                        className="absolute sparkle text-lg pointer-events-none"
                        style={{
                          left: '50%',
                          top: '50%',
                          '--sparkle-x': `${sparkle.x}px`,
                          '--sparkle-y': `${sparkle.y}px`,
                        } as React.CSSProperties & { '--sparkle-x': string; '--sparkle-y': string }}
                      >
                        ✨
                      </span>
                    ))}
                  </div>
                )}
                <span className={`
                  text-base sm:text-lg font-semibold
                  ${isPlaying ? 'text-amber-700' : 'text-amber-900'}
                `}>
                  {word.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
