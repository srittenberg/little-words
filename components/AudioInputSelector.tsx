'use client';

interface AudioInputSelectorProps {
  onSelectRecord: () => void;
  onSelectUpload: () => void;
}

export default function AudioInputSelector({ onSelectRecord, onSelectUpload }: AudioInputSelectorProps) {
  return (
    <div className="flex flex-col items-center py-6">
      <h3 className="text-lg font-medium text-amber-900 mb-6">
        How would you like to add audio?
      </h3>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {/* Record Option */}
        <button
          onClick={onSelectRecord}
          className="flex flex-col items-center gap-3 p-6 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-300 rounded-2xl transition-colors group"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
            </svg>
          </div>
          <span className="font-medium text-amber-900">Record</span>
          <span className="text-xs text-amber-600">Use microphone</span>
        </button>

        {/* Upload Option */}
        <button
          onClick={onSelectUpload}
          className="flex flex-col items-center gap-3 p-6 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-300 rounded-2xl transition-colors group"
        >
          <div className="w-16 h-16 rounded-full bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <span className="font-medium text-amber-900">Upload</span>
          <span className="text-xs text-amber-600">Choose a file</span>
        </button>
      </div>

      {/* Help Text */}
      <p className="mt-6 text-sm text-amber-600 text-center max-w-xs">
        Tip: To use a Voice Memo, first save it to Files from the Voice Memos app, then upload here.
      </p>
    </div>
  );
}
