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

export default function Soundboard({ words }: SoundboardProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [tappedId, setTappedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  // Haptic feedback helper function
  const triggerHaptic = () => {
    // Check if Vibration API is available (mobile browsers)
    if ('vibrate' in navigator) {
      // Short, subtle vibration (10ms) for a light tap feel
      navigator.vibrate(10);
    }
  };

  const handlePlay = (word: Word) => {
    // Trigger haptic feedback on tap
    triggerHaptic();

    // Trigger tap animation
    setTappedId(word.id);
    setTimeout(() => setTappedId(null), 200);

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
            <span className="inline-block transform rotate-[-2deg]">L</span>
            <span className="inline-block transform rotate-[1deg]">i</span>
            <span className="inline-block transform rotate-[-1deg]">t</span>
            <span className="inline-block transform rotate-[1.5deg]">t</span>
            <span className="inline-block transform rotate-[-1deg]">l</span>
            <span className="inline-block transform rotate-[0.5deg]">e</span>
            {' '}
            <span className="inline-block transform rotate-[2deg]">W</span>
            <span className="inline-block transform rotate-[-1.5deg]">o</span>
            <span className="inline-block transform rotate-[1deg]">r</span>
            <span className="inline-block transform rotate-[-0.5deg]">d</span>
            <span className="inline-block transform rotate-[1deg]">s</span>
          </h1>
          <p className="text-amber-700 text-lg font-medium italic">Tap a word to hear it ✨</p>
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
                    ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-200/50' 
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
