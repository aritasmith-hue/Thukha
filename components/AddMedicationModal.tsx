import React, { useState } from 'react';
import { Medication } from '../types';
import { CancelIcon, NewIcon } from './icons';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedication: (med: Medication) => void;
}

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({ isOpen, onClose, onAddMedication }) => {
  const [medication, setMedication] = useState<Medication>({
    name: '',
    strength: '',
    frequency: '',
    duration: '',
    purpose: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMedication(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (medication.name.trim()) {
      onAddMedication(medication);
      setMedication({ name: '', strength: '', frequency: '', duration: '', purpose: '' });
      onClose();
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
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold text-gray-700">Add Custom Medication</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close modal">
            <CancelIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Drug Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" id="name" value={medication.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="strength" className="block text-sm font-medium text-gray-700 mb-1">Strength/Dose</label>
                <input type="text" name="strength" id="strength" value={medication.strength} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <input type="text" name="frequency" id="frequency" value={medication.frequency} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
              </div>
               <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input type="text" name="duration" id="duration" value={medication.duration} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
              </div>
               <div>
                 <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">Purpose/Notes</label>
                <input type="text" name="purpose" id="purpose" value={medication.purpose} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!medication.name.trim()} className="px-4 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
              <NewIcon className="h-4 w-4" /> Add Medication
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
