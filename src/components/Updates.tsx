import React, { useState, useEffect } from 'react';
import {
  MegaphoneIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  StarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Update } from '../types/updates';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToAllUpdates, deleteUpdate } from '../lib/updatesService';
import AddUpdateModal from './modals/AddUpdateModal';
import EditUpdateModal from './modals/EditUpdateModal';
import ViewUpdateModal from './modals/ViewUpdateModal';

export default function Updates() {
  const { isAdmin } = useAuth();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'News' | 'Update' | 'Article' | 'Activity'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<Update | null>(null);

  // Load updates from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToAllUpdates((updatesData) => {
      setUpdates(updatesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'News':
        return <MegaphoneIcon className="h-6 w-6" />;
      case 'Update':
        return <InformationCircleIcon className="h-6 w-6" />;
      case 'Article':
        return <StarIcon className="h-6 w-6" />;
      case 'Activity':
        return <ExclamationTriangleIcon className="h-6 w-6" />;
      default:
        return <MegaphoneIcon className="h-6 w-6" />;
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'News':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700'
        };
      case 'Update':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-700'
        };
      case 'Article':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          icon: 'text-purple-600',
          badge: 'bg-purple-100 text-purple-700'
        };
      case 'Activity':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const filteredUpdates = updates
    .filter(update => {
      if (filter === 'all') return true;
      if (filter === 'active') return update.isActive;
      return update.type === filter;
    })
    .filter(update => {
      if (!searchTerm) return true;
      return update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             update.description.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const activeCount = updates.filter(u => u.isActive).length;
  const inactiveCount = updates.filter(u => !u.isActive).length;

  // Handler functions
  const handleViewUpdate = (update: Update) => {
    setSelectedUpdate(update);
    setShowViewModal(true);
  };

  const handleEditUpdate = (update: Update) => {
    setSelectedUpdate(update);
    setShowEditModal(true);
  };

  const handleDeleteUpdate = async (update: Update) => {
    if (!confirm(`Are you sure you want to delete "${update.title}"?`)) {
      return;
    }

    try {
      await deleteUpdate(update.id);
    } catch (error) {
      console.error('Error deleting update:', error);
      alert('Failed to delete update. Please try again.');
    }
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedUpdate(null);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now';
      if (diffHours === 1) return '1 hour ago';
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Updates & Announcements</h1>
          <p className="text-lg text-gray-600">
            Stay informed with the latest news and important notices
            {!loading && (
              <span className="ml-2 text-sm text-gray-500">
                ({activeCount} active, {inactiveCount} expired)
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {loading && (
            <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700">
              Loading...
            </span>
          )}
          {isAdmin && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Announcement
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search announcements..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
            >
              <option value="all">All Updates</option>
              <option value="active">Active ({activeCount})</option>
              <option value="News">News</option>
              <option value="Update">Updates</option>
              <option value="Article">Articles</option>
              <option value="Activity">Activities</option>
            </select>
            <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Updates List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading updates...</p>
          </div>
        ) : filteredUpdates.length > 0 ? (
          filteredUpdates.map((update) => {
            const colors = getUpdateColor(update.type);
            const Icon = getUpdateIcon(update.type);

            return (
              <div
                key={update.id}
                className={`card ${colors.bg} ${colors.border} ${
                  !update.isActive ? 'opacity-75' : ''
                } hover:shadow-lg transition-all duration-200 cursor-pointer`}
                onClick={() => handleViewUpdate(update)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-white ${colors.icon} shadow-sm`}>
                    {Icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {update.title}
                          </h3>
                          {!update.isActive && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                              Expired
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                            {update.type.toUpperCase()}
                          </span>
                          <span>{formatDate(update.createdAt)}</span>
                          {update.expiration && (
                            <span className="text-xs text-gray-500">
                              Expires: {update.expiration.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Admin Action Buttons */}
                      {isAdmin && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleViewUpdate(update)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditUpdate(update)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUpdate(update)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="prose prose-gray max-w-none">
                      <div 
                        className="text-gray-800 leading-relaxed overflow-hidden update-content-preview"
                        style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}
                        dangerouslySetInnerHTML={{ __html: update.description }}
                      />
                    </div>
                    
                    {/* Click to view indicator */}
                    <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                      <EyeIcon className="h-4 w-4" />
                      <span>Click to view full update</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card text-center py-12">
            <MegaphoneIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No updates found</h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'Try adjusting your search terms or filters.'
                : 'Check back later for updates and announcements.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Update Modal */}
      <AddUpdateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Updates will refresh automatically via real-time subscription
          setShowAddModal(false);
        }}
      />

      {/* View Update Modal */}
      <ViewUpdateModal
        isOpen={showViewModal}
        onClose={closeModals}
        update={selectedUpdate}
      />

      {/* Edit Update Modal */}
      <EditUpdateModal
        isOpen={showEditModal}
        onClose={closeModals}
        onSuccess={closeModals}
        update={selectedUpdate}
      />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .update-content-preview ul {
            list-style-type: disc;
            margin: 0.5em 0;
            padding-left: 2em;
          }
          
          .update-content-preview ol {
            list-style-type: decimal;
            margin: 0.5em 0;
            padding-left: 2em;
          }
          
          .update-content-preview li {
            display: list-item;
            margin: 0.25em 0;
          }
          
          .update-content-preview h1, 
          .update-content-preview h2, 
          .update-content-preview h3 {
            font-weight: bold;
            margin: 0.25em 0;
          }
          
          .update-content-preview h1 {
            font-size: 1.25em;
          }
          
          .update-content-preview h2 {
            font-size: 1.125em;
          }
          
          .update-content-preview h3 {
            font-size: 1.0625em;
          }
          
          .update-content-preview p {
            margin: 0.25em 0;
          }
          
          .update-content-preview a {
            color: #2563eb;
            text-decoration: underline;
          }
          
          .update-content-preview strong {
            font-weight: bold;
          }
          
          .update-content-preview em {
            font-style: italic;
          }
          
          .update-content-preview u {
            text-decoration: underline;
          }
        `
      }} />
    </div>
  );
}
