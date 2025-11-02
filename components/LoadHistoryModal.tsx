import React, { useState, useEffect } from 'react';
import { CancelIcon, HistoryIcon } from './icons';

interface LoadHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (patientId: string) => void;
}

const PATIENT_ID_REGEX = /^TMC-\d{7}$/;

export const LoadHistoryModal: React.FC<LoadHistoryModalProps> = ({ isOpen, onClose, onLoad }) => {
  const [patientId, setPatientId] = useState('');
  const [error, setError] = useState('');

  // Reset state when modal is closed to ensure it's clean for the next open
  useEffect(() => {
    if (!isOpen) {
      setPatientId('');
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientId(e.target.value.toUpperCase());
    // Clear error as soon as user starts typing
    if (error) {
        setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = patientId.trim();
    if (trimmedId && PATIENT_ID_REGEX.test(trimmedId)) {
      onLoad(trimmedId);
    } else {
      setError('Invalid format. Please use TMC-YYMM### (e.g., TMC-2405001).');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" 
        aria-modal="true" 
        role="dialog"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold text-gray-700">Load Patient History</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close modal">
            <CancelIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
              <input 
                type="text" 
                name="patientId" 
                id="patientId" 
                value={patientId} 
                onChange={handleChange}
                placeholder="e.g., TMC-2401001"
                required 
                className={`w-full px-3 py-2 border rounded-md shadow-sm transition-colors ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'}`}
                aria-invalid={!!error}
                aria-describedby={error ? 'patient-id-error' : undefined}
              />
              {error && <p id="patient-id-error" className="text-xs text-red-500 mt-1">{error}</p>}
              <p className="text-xs text-gray-500 mt-2">Enter the Patient ID to retrieve their past report summaries.</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!patientId.trim()} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
              <HistoryIcon className="h-4 w-4" /> Load History
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};