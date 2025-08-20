import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Update } from '../../types/updates';

interface ViewUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  update: Update | null;
}

export default function ViewUpdateModal({ isOpen, onClose, update }: ViewUpdateModalProps) {
  if (!isOpen || !update) return null;

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'News':
        return 'bg-blue-100 text-blue-700';
      case 'Update':
        return 'bg-green-100 text-green-700';
      case 'Article':
        return 'bg-purple-100 text-purple-700';
      case 'Activity':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getUpdateTypeColor(update.type)}`}>
                  {update.type.toUpperCase()}
                </span>
                {!update.isActive && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    Expired
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{update.title}</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Created: {formatDate(update.createdAt)}</p>
                {update.updatedAt.getTime() !== update.createdAt.getTime() && (
                  <p>Updated: {formatDate(update.updatedAt)}</p>
                )}
                {update.expiration && (
                  <p>Expires: {formatDate(update.expiration)}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Description</h4>
            <div className="prose prose-sm max-w-none">
              <div 
                className="text-gray-700 leading-relaxed text-sm update-content"
                dangerouslySetInnerHTML={{ __html: update.description }}
              />
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{
            __html: `
              .update-content ul {
                list-style-type: disc;
                margin: 0.5em 0;
                padding-left: 2em;
              }
              
              .update-content ol {
                list-style-type: decimal;
                margin: 0.5em 0;
                padding-left: 2em;
              }
              
              .update-content li {
                display: list-item;
                margin: 0.25em 0;
              }
              
              .update-content h1 {
                font-size: 1.5em;
                font-weight: bold;
                margin: 0.5em 0;
              }
              
              .update-content h2 {
                font-size: 1.25em;
                font-weight: bold;
                margin: 0.5em 0;
              }
              
              .update-content h3 {
                font-size: 1.125em;
                font-weight: bold;
                margin: 0.5em 0;
              }
              
              .update-content p {
                margin: 0.5em 0;
              }
              
              .update-content a {
                color: #2563eb;
                text-decoration: underline;
              }
              
              .update-content strong {
                font-weight: bold;
              }
              
              .update-content em {
                font-style: italic;
              }
              
              .update-content u {
                text-decoration: underline;
              }
            `
          }} />

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
