'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { Region } from 'wavesurfer.js/dist/plugins/regions';
import { formatTime, trimAudioBlob } from '@/lib/audioUtils';

interface WaveformTrimmerProps {
  audioBlob: Blob;
  onTrimComplete: (trimmedBlob: Blob) => void;
  onBack: () => void;
}

export default function WaveformTrimmer({ audioBlob, onTrimComplete, onBack }: WaveformTrimmerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const regionRef = useRef<Region | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    const audioUrl = URL.createObjectURL(audioBlob);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#fbbf24', // amber-400
      progressColor: '#f59e0b', // amber-500
      cursorColor: '#d97706', // amber-600
      cursorWidth: 2,
      height: 100,
      normalize: true,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
    });

    const regions = ws.registerPlugin(RegionsPlugin.create());
    regionsRef.current = regions;

    ws.on('ready', () => {
      const dur = ws.getDuration();
      setDuration(dur);
      setTrimEnd(dur);
      setIsReady(true);

      // Create initial region covering full audio
      const region = regions.addRegion({
        start: 0,
        end: dur,
        color: 'rgba(245, 158, 11, 0.2)', // amber-500 with opacity
        drag: false,
        resize: true,
      });
      regionRef.current = region;
    });

    ws.on('timeupdate', (time) => {
      setCurrentTime(time);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    ws.on('error', (err) => {
      console.error('WaveSurfer error:', err);
      setError('Failed to load audio. Please try again.');
    });

    // Handle region updates
    regions.on('region-updated', (region: Region) => {
      setTrimStart(region.start);
      setTrimEnd(region.end);
    });

    ws.load(audioUrl);
    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
      URL.revokeObjectURL(audioUrl);
    };
  }, [audioBlob]);

  const togglePlayPause = useCallback(() => {
    if (!wavesurferRef.current || !regionRef.current) return;
    
    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      // Play only the selected region
      const region = regionRef.current;
      wavesurferRef.current.setTime(region.start);
      wavesurferRef.current.play();
      
      // Stop when reaching region end
      const checkEnd = () => {
        if (wavesurferRef.current && regionRef.current) {
          const current = wavesurferRef.current.getCurrentTime();
          if (current >= regionRef.current.end) {
            wavesurferRef.current.pause();
            wavesurferRef.current.un('timeupdate', checkEnd);
          }
        }
      };
      wavesurferRef.current.on('timeupdate', checkEnd);
    }
  }, [isPlaying]);

  const resetTrim = useCallback(() => {
    if (!regionRef.current || !wavesurferRef.current) return;
    
    const dur = wavesurferRef.current.getDuration();
    regionRef.current.setOptions({
      start: 0,
      end: dur,
    });
    setTrimStart(0);
    setTrimEnd(dur);
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // If no trimming needed, use original blob
      if (trimStart === 0 && trimEnd === duration) {
        onTrimComplete(audioBlob);
        return;
      }

      const trimmedBlob = await trimAudioBlob(audioBlob, trimStart, trimEnd);
      onTrimComplete(trimmedBlob);
    } catch (err) {
      console.error('Trim failed:', err);
      setError('Failed to trim audio. Please try again.');
      setIsProcessing(false);
    }
  }, [audioBlob, trimStart, trimEnd, duration, onTrimComplete]);

  const trimDuration = trimEnd - trimStart;

  return (
    <div className="flex flex-col">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {/* Waveform Container */}
      <div className="relative mb-4">
        <div 
          ref={containerRef} 
          className="w-full bg-amber-50 rounded-xl p-4 min-h-[132px]"
        />
        
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2 text-amber-600">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading waveform...</span>
            </div>
          </div>
        )}
      </div>

      {/* Time Display */}
      <div className="flex justify-between items-center mb-4 text-sm text-amber-700">
        <span>Start: {formatTime(trimStart)}</span>
        <span className="font-medium text-amber-900">
          Duration: {formatTime(trimDuration)}
        </span>
        <span>End: {formatTime(trimEnd)}</span>
      </div>

      {/* Instructions */}
      <p className="text-center text-amber-600 text-sm mb-4">
        Drag the edges of the highlighted region to trim
      </p>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Play/Pause */}
        <button
          onClick={togglePlayPause}
          disabled={!isReady || isProcessing}
          className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white flex items-center justify-center shadow-md transition-colors"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Reset */}
        <button
          onClick={resetTrim}
          disabled={!isReady || isProcessing}
          className="px-4 py-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors disabled:opacity-50"
        >
          Use full clip
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 py-3 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isReady || isProcessing || trimDuration < 0.1}
          className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white font-semibold rounded-xl transition-colors"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}
