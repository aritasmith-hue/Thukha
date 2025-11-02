import React from 'react';
import { HistoryIcon, CloseIcon } from './icons';

interface PatientHistoryDisplayProps {
  history: string;
  onClear: () => void;
}

export const PatientHistoryDisplay: React.FC<PatientHistoryDisplayProps> = ({ history, onClear }) => {
  return (
    <div className="mt-6 p-4 bg-blue-50/70 rounded-lg border border-blue-200/50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-blue-800 flex items-center space-x-2">
          <HistoryIcon className="h-5 w-5" />
          <span>Patient History Summary</span>
        </h3>
        <button
          onClick={onClear}
          className="p-1.5 bg-blue-100 rounded-full text-blue-700 hover:bg-red-200 hover:text-red-800 transition-colors"
          aria-label="Clear patient history"
          title="Clear History"
        >
          <CloseIcon className="h-3 w-3" />
        </button>
      </div>
      <pre className="text-xs text-blue-900 bg-white/50 p-3 rounded-md max-h-40 overflow-y-auto whitespace-pre-wrap font-sans">
        {history}
      </pre>
    </div>
  );
};