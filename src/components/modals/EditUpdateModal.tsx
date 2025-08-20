import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { updateUpdate } from '../../lib/updatesService';
import { Update, UpdateType } from '../../types/updates';
import { useAuth } from '../../contexts/AuthContext';
import RichTextEditor from '../RichTextEditor';

interface EditUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  update: Update | null;
}

interface UpdateForm {
  title: string;
  type: UpdateType;
  description: string;
  expiration: string;
  hasExpiration: boolean;
}

export default function EditUpdateModal({ isOpen, onClose, onSuccess, update }: EditUpdateModalProps) {
  const { currentUser, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateForm>({
    title: '',
    type: 'News',
    description: '',
    expiration: '',
    hasExpiration: false
  });

  // Load update data when modal opens
  useEffect(() => {
    if (update && isOpen) {
      setFormData({
        title: update.title,
        type: update.type,
        description: update.description,
        expiration: update.expiration ? update.expiration.toISOString().slice(0, 16) : '',
        hasExpiration: !!update.expiration
      });
    }
  }, [update, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isAdmin || !update) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        title: formData.title,
        type: formData.type,
        description: formData.description
      };

      // Add expiration if set
      if (formData.hasExpiration && formData.expiration) {
        updateData.expiration = new Date(formData.expiration);
      } else if (!formData.hasExpiration) {
        // Remove expiration if unchecked
        updateData.expiration = null;
      }

      await updateUpdate(update.id, updateData);
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating update:', error);
      alert('Failed to update announcement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof UpdateForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !update || !isAdmin) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Update</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter update title..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value as UpdateType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  required
                >
                  <option value="News">News</option>
                  <option value="Update">Update</option>
                  <option value="Article">Article</option>
                  <option value="Activity">Activity</option>
                </select>
              </div>
            </div>

            {/* Description with Rich Text Editor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              
              <RichTextEditor
                value={formData.description}
                onChange={(value) => handleChange('description', value)}
                placeholder="Enter update description... Use the toolbar to format your text."
                minHeight={200}
              />
              
              <p className="text-sm text-gray-600 mt-1">
                Use the toolbar buttons to format your text. You can bold text, add headings, create lists, and more.
              </p>
            </div>

            {/* Expiration */}
            <div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="hasExpiration"
                  checked={formData.hasExpiration}
                  onChange={(e) => handleChange('hasExpiration', e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="hasExpiration" className="ml-2 text-sm font-semibold text-gray-700">
                  Set expiration date
                </label>
              </div>

              {formData.hasExpiration && (
                <div>
                  <input
                    type="datetime-local"
                    value={formData.expiration}
                    onChange={(e) => handleChange('expiration', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    The update will automatically become inactive after this date.
                  </p>
                </div>
              )}
            </div>



            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Announcement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
