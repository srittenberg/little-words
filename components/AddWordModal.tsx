'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import AudioInputSelector from './AudioInputSelector';
import AudioRecorder from './AudioRecorder';
import WaveformTrimmer from './WaveformTrimmer';
import { getAudioDuration } from '@/lib/audioUtils';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'select' | 'record' | 'upload' | 'trim' | 'details';

// Maximum audio duration in seconds
const MAX_AUDIO_DURATION = 30;

// Common emojis for quick selection
const EMOJI_OPTIONS = [
  '😊', '😂', '🥰', '😍', '🤗', '😎', '🥳', '😴',
  '👶', '👧', '👦', '👨', '👩', '👴', '👵', '🐶',
  '🐱', '🐰', '🐻', '🦊', '🐸', '🐵', '🐷', '🐮',
  '🍎', '🍌', '🍓', '🥑', '🍕', '🍔', '🍦', '🍪',
  '⚽', '🏀', '🎨', '🎵', '📚', '✨', '❤️', '🌟',
  '🚗', '✈️', '🏠', '🌈', '☀️', '🌙', '⭐', '🔥',
  '👋', '👍', '👏', '🙌', '💪', '🤝', '👆', '✌️',
];

export default function AddWordModal({ isOpen, onClose, onSuccess }: AddWordModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal closes
  const resetForm = useCallback(() => {
    setStep('select');
    setAudioBlob(null);
    setTrimmedBlob(null);
    setLabel('');
    setEmoji('');
    setError(null);
    setShowEmojiPicker(false);
    setIsSubmitting(false);
    setIsValidating(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Step handlers
  const handleSelectRecord = () => {
    setStep('record');
  };

  const handleSelectUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input for future use
    e.target.value = '';

    // Validate file type
    const validTypes = ['audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/m4a', 'audio/webm'];
    const isValidType = validTypes.some(type => file.type.includes(type.split('/')[1])) || 
                        file.name.endsWith('.m4a') || 
                        file.name.endsWith('.mp3') || 
                        file.name.endsWith('.wav');
    
    if (!isValidType) {
      setError('Please upload an audio file (.m4a, .mp3, or .wav)');
      return;
    }

    // Check audio duration
    setIsValidating(true);
    setError(null);
    
    try {
      const duration = await getAudioDuration(file);
      
      if (duration > MAX_AUDIO_DURATION) {
        setError(`Audio is too long (${Math.round(duration)}s). Maximum allowed is ${MAX_AUDIO_DURATION} seconds.`);
        setIsValidating(false);
        return;
      }

      setAudioBlob(file);

      // Auto-fill label from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setLabel(nameWithoutExt);

      setStep('trim');
    } catch (err) {
      console.error('Failed to read audio duration:', err);
      setError('Could not read audio file. Please try a different file.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setStep('trim');
  };

  const handleTrimComplete = (blob: Blob) => {
    setTrimmedBlob(blob);
    setStep('details');
  };

  const handleBack = () => {
    switch (step) {
      case 'record':
      case 'upload':
        setStep('select');
        setAudioBlob(null);
        break;
      case 'trim':
        setStep('select');
        setAudioBlob(null);
        break;
      case 'details':
        setStep('trim');
        setTrimmedBlob(null);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trimmedBlob || !label.trim() || !emoji.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Create a file from the blob with proper extension
      const extension = trimmedBlob.type.includes('wav') ? 'wav' : 
                        trimmedBlob.type.includes('mp4') || trimmedBlob.type.includes('m4a') ? 'm4a' : 
                        'webm';
      const file = new File([trimmedBlob], `${label.trim()}.${extension}`, { type: trimmedBlob.type });
      
      formData.append('audio', file);
      formData.append('label', label.trim());
      formData.append('emoji', emoji.trim());

      const response = await fetch('/api/words/add', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add word');
      }

      // Success!
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add word');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get header title based on step
  const getHeaderTitle = () => {
    switch (step) {
      case 'select': return 'Add New Word';
      case 'record': return 'Record Audio';
      case 'upload': return 'Upload Audio';
      case 'trim': return 'Trim Audio';
      case 'details': return 'Word Details';
    }
  };

  // Progress indicator
  const getProgress = () => {
    switch (step) {
      case 'select': return 1;
      case 'record': return 2;
      case 'upload': return 2;
      case 'trim': return 3;
      case 'details': return 4;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step !== 'select' && (
                <button
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-full transition-colors -ml-1.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h2 className="text-xl font-bold text-amber-900">{getHeaderTitle()}</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-1.5 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= getProgress() ? 'bg-amber-400' : 'bg-amber-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".m4a,.mp3,.wav,audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step: Select Input Method */}
          {step === 'select' && (
            <div className="p-6">
              {isValidating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="animate-spin w-8 h-8 text-amber-500 mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-amber-700">Checking audio file...</p>
                </div>
              ) : (
                <AudioInputSelector
                  onSelectRecord={handleSelectRecord}
                  onSelectUpload={handleSelectUpload}
                />
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step: Record */}
          {step === 'record' && (
            <div className="p-6">
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                onCancel={() => setStep('select')}
                maxDuration={MAX_AUDIO_DURATION}
              />
            </div>
          )}

          {/* Step: Trim */}
          {step === 'trim' && audioBlob && (
            <div className="p-6">
              <WaveformTrimmer
                audioBlob={audioBlob}
                onTrimComplete={handleTrimComplete}
                onBack={handleBack}
              />
            </div>
          )}

          {/* Step: Details */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Label */}
              <div>
                <label htmlFor="label" className="block text-sm font-medium text-amber-800 mb-2">
                  Word Label
                </label>
                <input
                  id="label"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Banana"
                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl bg-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 text-amber-900 placeholder:text-amber-300"
                  autoFocus
                />
              </div>

              {/* Emoji */}
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  Emoji
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl bg-white hover:border-amber-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 text-left flex items-center justify-between"
                  >
                    {emoji ? (
                      <span className="text-2xl">{emoji}</span>
                    ) : (
                      <span className="text-amber-300">Pick an emoji...</span>
                    )}
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute z-10 mt-2 w-full p-3 bg-white border-2 border-amber-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_OPTIONS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => {
                              setEmoji(e);
                              setShowEmojiPicker(false);
                            }}
                            className="p-2 text-xl hover:bg-amber-100 rounded-lg transition-colors"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-amber-100">
                        <input
                          type="text"
                          value={emoji}
                          onChange={(e) => setEmoji(e.target.value)}
                          placeholder="Or type/paste emoji"
                          className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !label.trim() || !emoji.trim()}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding...
                  </span>
                ) : (
                  'Add Word'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
