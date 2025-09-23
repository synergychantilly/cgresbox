import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { documentTemplateService, documentCategoryService } from '../../lib/documentsService';
import { DocumentCategory, DocumentTemplate } from '../../types/documents';
import { useAuth } from '../../contexts/AuthContext';

interface EditDocumentTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  template: DocumentTemplate | null;
}

export default function EditDocumentTemplateModal({ isOpen, onClose, onSuccess, template }: EditDocumentTemplateModalProps) {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    docusealLink: '',
    docusealTemplateId: '',
    categoryId: '',
    isRequired: false,
    reminderDays: 7,
    expiryDays: 365,
    tags: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (template) {
        populateForm(template);
      }
    }
  }, [isOpen, template]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await documentCategoryService.getAll();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const populateForm = (template: DocumentTemplate) => {
    setFormData({
      title: template.title,
      description: template.description,
      docusealLink: template.docusealLink,
      docusealTemplateId: template.docusealTemplateId,
      categoryId: template.categoryId,
      isRequired: template.isRequired,
      reminderDays: template.reminderDays,
      expiryDays: template.expiryDays,
      tags: template.tags.join(', ')
    });

    // Set selected category
    const category = categories.find(c => c.id === template.categoryId);
    if (category) {
      setSelectedCategory(category);
      setCategorySearch(category.name);
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Check if search matches exactly
  const exactMatch = categories.find(category => 
    category.name.toLowerCase() === categorySearch.toLowerCase()
  );

  const handleCategorySearchChange = (value: string) => {
    setCategorySearch(value);
    setShowCategoryDropdown(true);
    setSelectedCategory(null);
    setSelectedIndex(-1);
    setFormData({ ...formData, categoryId: '' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showCategoryDropdown) return;

    const totalOptions = filteredCategories.length + (categorySearch.trim() && !exactMatch ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalOptions) % totalOptions);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredCategories.length) {
          handleCategorySelect(filteredCategories[selectedIndex]);
        } else if (selectedIndex === filteredCategories.length && categorySearch.trim() && !exactMatch) {
          handleCreateNewCategory();
        }
        break;
      case 'Escape':
        setShowCategoryDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleCategorySelect = (category: DocumentCategory) => {
    setSelectedCategory(category);
    setCategorySearch(category.name);
    setFormData({ ...formData, categoryId: category.id });
    setShowCategoryDropdown(false);
  };

  const handleCreateNewCategory = async () => {
    if (!userData || !categorySearch.trim() || exactMatch) return;

    setCreatingCategory(true);
    try {
      const newCategoryId = await documentCategoryService.create({
        name: categorySearch.trim(),
        description: `Auto-created category: ${categorySearch.trim()}`,
        color: 'blue', // Default color
        createdBy: userData.id,
        isActive: true
      });

      // Create the new category object
      const newCategory: DocumentCategory = {
        id: newCategoryId,
        name: categorySearch.trim(),
        description: `Auto-created category: ${categorySearch.trim()}`,
        color: 'blue',
        createdBy: userData.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to categories list immediately
      setCategories(prev => [...prev, newCategory]);
      
      // Select the newly created category
      handleCategorySelect(newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !template) return;

    // Validate that a category is selected
    if (!selectedCategory || !formData.categoryId) {
      alert('Please select or create a category.');
      return;
    }

    setLoading(true);
    try {
      await documentTemplateService.update(template.id, {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      });
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error updating document template:', error);
      alert('Failed to update document template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      docusealLink: '',
      docusealTemplateId: '',
      categoryId: '',
      isRequired: false,
      reminderDays: 7,
      expiryDays: 365,
      tags: ''
    });
    setCategorySearch('');
    setSelectedCategory(null);
    setShowCategoryDropdown(false);
    setCreatingCategory(false);
    setSelectedIndex(-1);
    onClose();
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Edit Document Template</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Document Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                placeholder="e.g., Background Check Form"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                rows={3}
                placeholder="Brief description of the document purpose..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                DocuSeal Link *
              </label>
              <input
                type="url"
                value={formData.docusealLink}
                onChange={(e) => setFormData({ ...formData, docusealLink: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                placeholder="https://docuseal.com/..."
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                Direct link to the DocuSeal template users will access
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                DocuSeal Template ID *
              </label>
              <input
                type="text"
                value={formData.docusealTemplateId}
                onChange={(e) => setFormData({ ...formData, docusealTemplateId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none font-mono"
                placeholder="548893"
                required
              />
              <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                <strong>Critical for tracking!</strong> Find this in your DocuSeal template under "template.id" in webhook payloads. 
                For template "548893", enter exactly: <code className="bg-gray-100 px-1 rounded">548893</code>
              </p>
            </div>

            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <div className="relative">
                <input
                  ref={categoryInputRef}
                  type="text"
                  value={categorySearch}
                  onChange={(e) => handleCategorySearchChange(e.target.value)}
                  onFocus={() => setShowCategoryDropdown(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search or create category..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  required
                />
                <ChevronDownIcon 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                />
              </div>

              {/* Dropdown Menu */}
              {showCategoryDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {/* Existing Categories */}
                  {filteredCategories.length > 0 && (
                    <div>
                      {filteredCategories.map((category, index) => (
                        <div
                          key={category.id}
                          onClick={() => handleCategorySelect(category)}
                          className={`px-3 py-2 cursor-pointer flex items-center ${
                            selectedIndex === index ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full bg-${category.color || 'blue'}-500 mr-2`}></div>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            {category.description && (
                              <div className="text-xs text-gray-500">{category.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Create New Category Option */}
                  {categorySearch.trim() && !exactMatch && (
                    <div
                      onClick={handleCreateNewCategory}
                      className={`px-3 py-2 cursor-pointer border-t border-gray-200 flex items-center text-blue-600 ${
                        selectedIndex === filteredCategories.length ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-blue-50'
                      }`}
                    >
                      {creatingCategory ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <PlusIcon className="h-4 w-4 mr-2" />
                          <span>Create "{categorySearch}"</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No Results */}
                  {filteredCategories.length === 0 && !categorySearch.trim() && (
                    <div className="px-3 py-2 text-gray-500 text-center">
                      Start typing to search or create a category
                    </div>
                  )}
                </div>
              )}

              {/* Selected Category Display */}
              {selectedCategory && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <div className={`w-3 h-3 rounded-full bg-${selectedCategory.color || 'blue'}-500 mr-2`}></div>
                  <span>Selected: <strong>{selectedCategory.name}</strong></span>
                </div>
              )}

              <p className="text-sm text-gray-600 mt-1">
                Type to search existing categories or create a new one
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reminder Days
                </label>
                <input
                  type="number"
                  value={formData.reminderDays}
                  onChange={(e) => setFormData({ ...formData, reminderDays: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  min="0"
                  max="365"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Days before expiry to send reminder
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valid for (Days)
                </label>
                <input
                  type="number"
                  value={formData.expiryDays}
                  onChange={(e) => setFormData({ ...formData, expiryDays: parseInt(e.target.value) || 365 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  min="1"
                  max="3650"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Document expires after completion
                </p>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Required Document
                </span>
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Mark as required for user compliance
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                placeholder="onboarding, compliance, training (comma-separated)"
              />
              <p className="text-sm text-gray-600 mt-1">
                Separate multiple tags with commas
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !selectedCategory}
              >
                {loading ? 'Updating...' : 'Update Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


