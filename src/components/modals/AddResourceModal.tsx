import React, { useState, useRef } from 'react';
import { XMarkIcon, CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { createResource } from '../../lib/resourcesService';
import { validateFile, formatFileSize, getFileIcon } from '../../lib/storageService';
import { ResourceType } from '../../types/resources';
import { useAuth } from '../../contexts/AuthContext';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ResourceForm {
  title: string;
  type: ResourceType;
  description: string;
  url: string;
  category: string;
  tags: string;
}

const resourceTypes: ResourceType[] = ['Document', 'Image', 'Resource', 'URL'];
const categories = ['Policies', 'Training', 'Clinical', 'Administrative', 'Safety', 'Development', 'Wellness', 'Scheduling'];

export default function AddResourceModal({ isOpen, onClose, onSuccess }: AddResourceModalProps) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<{ isValid: boolean; error?: string } | null>(null);
  
  const [formData, setFormData] = useState<ResourceForm>({
    title: '',
    type: 'Document',
    description: '',
    url: '',
    category: '',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate that we have either a file or URL based on type
    if (formData.type === 'URL' && !formData.url.trim()) {
      alert('Please enter a URL for URL type resources.');
      return;
    }

    if (formData.type !== 'URL' && !selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    try {
      const resourceData = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        url: formData.type === 'URL' ? formData.url : undefined,
        category: formData.category || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined
      };

      await createResource(
        resourceData,
        currentUser.uid,
        formData.type !== 'URL' ? selectedFile || undefined : undefined
      );

      // Reset form and close modal
      setFormData({
        title: '',
        type: 'Document',
        description: '',
        url: '',
        category: '',
        tags: ''
      });
      setSelectedFile(null);
      setFileValidation(null);
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating resource:', error);
      alert('Failed to create resource. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ResourceForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFileValidation(null);
      return;
    }

    const validation = validateFile(file);
    setFileValidation(validation);
    
    if (validation.isValid) {
      setSelectedFile(file);
      // Auto-fill title if empty
      if (!formData.title) {
        const fileName = file.name.split('.')[0];
        handleChange('title', fileName);
      }
    } else {
      setSelectedFile(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isUrlType = formData.type === 'URL';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Resource</h2>
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
                  placeholder="Enter resource title..."
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
                  onChange={(e) => {
                    handleChange('type', e.target.value as ResourceType);
                    // Clear file when switching to URL type
                    if (e.target.value === 'URL') {
                      removeFile();
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  required
                >
                  {resourceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* URL field for URL type resources */}
            {isUrlType && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleChange('url', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  required={isUrlType}
                />
              </div>
            )}

            {/* File Upload for non-URL types */}
            {!isUrlType && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  File Upload *
                </label>
                
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 cursor-pointer transition-colors"
                  >
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-600 mb-2">Click to upload file</p>
                    <p className="text-sm text-gray-500">Maximum file size: 20MB</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supported: PDF, DOC, XLS, PPT, Images, Archives, etc.
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(selectedFile.type)}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip,.rar,.7z,.json,.xml"
                />

                {fileValidation && !fileValidation.isValid && (
                  <p className="text-red-600 text-sm mt-2">{fileValidation.error}</p>
                )}
              </div>
            )}

            {/* Category and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                >
                  <option value="">Select a category...</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="tag1, tag2, tag3..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Separate tags with commas
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter resource description..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none resize-none"
                required
              />
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
                disabled={isLoading || (!isUrlType && !selectedFile) || (isUrlType && !formData.url)}
              >
                {isLoading ? 'Creating...' : 'Create Resource'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
