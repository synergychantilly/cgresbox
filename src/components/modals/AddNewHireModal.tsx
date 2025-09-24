import React, { useState } from 'react';
import { X, User, MapPin, Briefcase } from 'lucide-react';

interface AddNewHireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (firstName: string, lastName: string, zipCode: string, occupation: string) => Promise<void>;
  loading: boolean;
}

const AddNewHireModal: React.FC<AddNewHireModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  loading
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [occupation, setOccupation] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !zipCode.trim() || !occupation.trim()) {
      setError('All fields are required');
      return;
    }

    if (zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) {
      setError('ZIP code must be exactly 5 digits');
      return;
    }

    try {
      await onAdd(firstName.trim(), lastName.trim(), zipCode.trim(), occupation.trim());
      // Reset form
      setFirstName('');
      setLastName('');
      setZipCode('');
      setOccupation('');
      setError('');
    } catch (error: any) {
      setError(error.message || 'Failed to add new hire');
    }
  };

  const handleClose = () => {
    setFirstName('');
    setLastName('');
    setZipCode('');
    setOccupation('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add New Hire</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* First Name */}
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter first name"
              />
            </div>
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter last name"
              />
            </div>
          </div>

          {/* ZIP Code */}
          <div className="space-y-2">
            <label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
              ZIP Code <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="zipCode"
                type="text"
                required
                pattern="[0-9]{5}"
                maxLength={5}
                value={zipCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setZipCode(value);
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter ZIP code"
              />
            </div>
            <p className="text-xs text-gray-500">Must be exactly 5 digits</p>
          </div>

          {/* Occupation */}
          <div className="space-y-2">
            <label htmlFor="occupation" className="text-sm font-medium text-gray-700">
              Occupation <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="occupation"
                type="text"
                required
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Caregiver, Nurse, Administrative Assistant"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </div>
              ) : (
                'Add New Hire'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewHireModal;

