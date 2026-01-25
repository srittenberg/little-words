'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  getSupportedMimeType,
  formatTime,
  isMediaRecorderSupported,
  requestMicrophoneAccess,
} from '@/lib/audioUtils';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
  maxDuration?: number; // Maximum recording duration in seconds
}

type RecordingState = 'idle' | 'requesting' | 'ready' | 'recording' | 'error';

export default function AudioRecorder({ onRecordingComplete, onCancel, maxDuration }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const stopRecordingRef = useRef<(() => void) | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stopStream]);

  const requestPermission = useCallback(async () => {
    if (!isMediaRecorderSupported()) {
      setError('Recording is not supported in this browser');
      setState('error');
      return;
    }

    setState('requesting');
    setError(null);

    try {
      const stream = await requestMicrophoneAccess();
      streamRef.current = stream;
      setState('ready');
    } catch (err) {
      console.error('Microphone access error:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        setError('Could not access microphone. Please try again.');
      }
      setState('error');
    }
  }, []);

  // Request permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mimeType = getSupportedMimeType();
    
    try {
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }
      
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(blob);
      };

      mediaRecorder.onerror = () => {
        setError('Recording failed. Please try again.');
        setState('error');
      };

      mediaRecorder.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();
      setState('recording');

      // Start timer with auto-stop at max duration
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);
        
        // Auto-stop when max duration is reached
        if (maxDuration && elapsed >= maxDuration) {
          stopRecordingRef.current?.();
        }
      }, 100);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
      setState('error');
    }
  }, [onRecordingComplete, maxDuration]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    stopStream();
    setState('idle');
  }, [stopStream]);

  // Keep ref updated for auto-stop callback
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  const handleCancel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Don't trigger onstop callback when canceling
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    
    stopStream();
    onCancel();
  }, [stopStream, onCancel]);

  return (
    <div className="flex flex-col items-center py-8">
      {/* Status/Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center max-w-xs">
          {error}
          <button
            onClick={requestPermission}
            className="block w-full mt-2 text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )}

      {state === 'requesting' && (
        <div className="mb-6 text-amber-600 text-center">
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Requesting microphone access...</span>
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="mb-8 text-center">
        <div className="text-5xl font-mono text-amber-900 tabular-nums">
          {formatTime(duration)}
        </div>
        {maxDuration && state === 'recording' && (
          <div className="mt-2 text-sm text-amber-600">
            {Math.ceil(maxDuration - duration)}s remaining
          </div>
        )}
        {maxDuration && state !== 'recording' && (
          <div className="mt-2 text-sm text-amber-500">
            Max: {maxDuration}s
          </div>
        )}
      </div>

      {/* Recording Button */}
      <div className="relative mb-8">
        {state === 'recording' && (
          <div className="absolute inset-0 -m-2 rounded-full bg-red-400/30 animate-ping" />
        )}
        
        {state === 'ready' && (
          <button
            onClick={startRecording}
            className="relative w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          >
            <div className="w-8 h-8 rounded-full bg-white group-hover:scale-90 transition-transform" />
          </button>
        )}

        {state === 'recording' && (
          <button
            onClick={stopRecording}
            className="relative w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          >
            <div className="w-8 h-8 rounded-md bg-white group-hover:scale-90 transition-transform" />
          </button>
        )}

        {(state === 'idle' || state === 'requesting' || state === 'error') && (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gray-400" />
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="text-amber-700 text-center mb-6">
        {state === 'ready' && 'Tap the button to start recording'}
        {state === 'recording' && 'Tap to stop recording'}
        {state === 'requesting' && 'Please allow microphone access'}
        {state === 'error' && 'Recording unavailable'}
      </p>

      {/* Cancel Button */}
      <button
        onClick={handleCancel}
        className="px-6 py-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
