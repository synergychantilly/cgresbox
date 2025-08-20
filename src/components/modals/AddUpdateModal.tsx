import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createUpdate } from '../../lib/updatesService';
import { UpdateType } from '../../types/updates';
import { useAuth } from '../../contexts/AuthContext';

interface AddUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UpdateForm {
  title: string;
  type: UpdateType;
  description: string;
  expiration: string;
  hasExpiration: boolean;
}

export default function AddUpdateModal({ isOpen, onClose, onSuccess }: AddUpdateModalProps) {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateForm>({
    title: '',
    type: 'News',
    description: '',
    expiration: '',
    hasExpiration: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

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
      }

      await createUpdate(updateData, currentUser.uid);

      // Reset form and close modal
      setFormData({
        title: '',
        type: 'News',
        description: '',
        expiration: '',
        hasExpiration: false
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating update:', error);
      alert('Failed to create update. Please try again.');
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

  // Rich text formatting buttons
  const insertFormatting = (format: string) => {
    const textarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText || 'Bold text'}</strong>`;
        break;
      case 'italic':
        formattedText = `<em>${selectedText || 'Italic text'}</em>`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText || 'Underlined text'}</u>`;
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          formattedText = `<a href="${url}">${selectedText || 'Link text'}</a>`;
        } else {
          return;
        }
        break;
      case 'heading':
        formattedText = `<h3>${selectedText || 'Heading text'}</h3>`;
        break;
      case 'list':
        formattedText = `<ul><li>${selectedText || 'List item'}</li></ul>`;
        break;
    }

    const newText = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    handleChange('description', newText);
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Update</h2>
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

            {/* Description with Rich Text Controls */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              
              {/* Rich Text Toolbar */}
              <div className="border border-gray-300 rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertFormatting('bold')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('italic')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 italic"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('underline')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 underline"
                  title="Underline"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('heading')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title="Heading"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('list')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title="List"
                >
                  UL
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('link')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title="Link"
                >
                  🔗
                </button>
              </div>

              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter update description... You can use HTML formatting."
                rows={8}
                className="w-full border border-gray-300 border-t-0 rounded-b-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none resize-none"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                HTML formatting is supported. Use the toolbar buttons or write HTML directly.
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

            {/* Preview */}
            {formData.description && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preview
                </label>
                <div 
                  className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[100px] prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.description }}
                />
              </div>
            )}

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
                {isLoading ? 'Creating...' : 'Create Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
