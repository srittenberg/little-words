'use client';

import { useState, useRef, useEffect } from 'react';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Clean up audio URL on unmount or file change
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAudioFile(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(null);
      setLabel('');
      setEmoji('');
      setError(null);
      setShowEmojiPicker(false);
    }
  }, [isOpen, audioUrl]);

  const resetForm = () => {
    setAudioFile(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setLabel('');
    setEmoji('');
    setError(null);
    setShowEmojiPicker(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/m4a'];
    if (!validTypes.some(type => file.type.includes(type.split('/')[1]) || file.name.endsWith('.m4a'))) {
      setError('Please upload an audio file (.m4a, .mp3, or .wav)');
      return;
    }

    // Clean up previous URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setError(null);

    // Auto-fill label from filename if empty
    if (!label) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setLabel(nameWithoutExt);
    }
  };

  const handlePlayPreview = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile || !label.trim() || !emoji.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
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
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-900">Add New Word</h2>
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Audio Upload */}
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">
              Voice Recording
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".m4a,.mp3,.wav,audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {!audioFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-amber-300 rounded-2xl bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 transition-colors"
              >
                <div className="flex flex-col items-center text-amber-600">
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="font-medium">Tap to upload audio</span>
                  <span className="text-sm text-amber-500 mt-1">.m4a, .mp3, .wav</span>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <button
                  type="button"
                  onClick={handlePlayPreview}
                  className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-amber-900 truncate">{audioFile.name}</p>
                  <p className="text-sm text-amber-600">{(audioFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAudioFile(null);
                    if (audioUrl) URL.revokeObjectURL(audioUrl);
                    setAudioUrl(null);
                  }}
                  className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {audioUrl && <audio ref={audioRef} src={audioUrl} />}
              </div>
            )}
          </div>

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
            disabled={isSubmitting || !audioFile || !label.trim() || !emoji.trim()}
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
      </div>
    </div>
  );
}
