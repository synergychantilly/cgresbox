import React, { useState } from 'react';
import {
  MegaphoneIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  StarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Announcement } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AddUpdateModal from './modals/AddUpdateModal';

// Empty array - announcements will be loaded from Firebase
const mockAnnouncements: Announcement[] = [];

export default function Updates() {
  const { isAdmin } = useAuth();
  const [announcements] = useState<Announcement[]>(mockAnnouncements);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent' | 'info' | 'warning' | 'celebration'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <ExclamationTriangleIcon className="h-6 w-6" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6" />;
      case 'celebration':
        return <StarIcon className="h-6 w-6" />;
      default:
        return <MegaphoneIcon className="h-6 w-6" />;
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return {
          bg: 'bg-destructive-50',
          border: 'border-destructive-200',
          icon: 'text-destructive-600',
          badge: 'bg-destructive-100 text-destructive-700'
        };
      case 'warning':
        return {
          bg: 'bg-accent-50',
          border: 'border-accent-200',
          icon: 'text-accent-600',
          badge: 'bg-accent-100 text-accent-700'
        };
      case 'info':
        return {
          bg: 'bg-primary-50',
          border: 'border-primary-200',
          icon: 'text-primary-600',
          badge: 'bg-primary-100 text-primary-700'
        };
      case 'celebration':
        return {
          bg: 'bg-secondary-50',
          border: 'border-secondary-200',
          icon: 'text-secondary-600',
          badge: 'bg-secondary-100 text-secondary-700'
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

  const filteredAnnouncements = announcements
    .filter(announcement => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !announcement.isRead;
      return announcement.type === filter;
    })
    .filter(announcement => {
      if (!searchTerm) return true;
      return announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  const unreadCount = announcements.filter(a => !a.isRead).length;
  const urgentCount = announcements.filter(a => a.type === 'urgent').length;

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
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-destructive-100 text-destructive-700">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {urgentCount > 0 && (
            <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-destructive-100 text-destructive-700 animate-pulse">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              {urgentCount} Urgent
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
              <option value="unread">Unread ({unreadCount})</option>
              <option value="urgent">Urgent</option>
              <option value="warning">Warnings</option>
              <option value="info">Information</option>
              <option value="celebration">Celebrations</option>
            </select>
            <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => {
            const colors = getAnnouncementColor(announcement.type);
            const Icon = getAnnouncementIcon(announcement.type);

            return (
              <div
                key={announcement.id}
                className={`card ${colors.bg} ${colors.border} ${
                  !announcement.isRead ? 'ring-2 ring-primary-200 shadow-lg' : ''
                } hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-white ${colors.icon} shadow-sm`}>
                    {Icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-xl font-bold text-gray-900 ${
                            !announcement.isRead ? 'font-extrabold' : ''
                          }`}>
                            {announcement.title}
                          </h3>
                          {!announcement.isRead && (
                            <span className="inline-block w-3 h-3 bg-primary-500 rounded-full"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                            {announcement.type.toUpperCase()}
                          </span>
                          <span>By {announcement.author}</span>
                          <span>{formatDate(announcement.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-800 leading-relaxed">
                        {announcement.content}
                      </p>
                    </div>

                    {announcement.attachments && announcement.attachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Attachments:</h4>
                        <div className="flex flex-wrap gap-2">
                          {announcement.attachments.map((attachment, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 bg-white text-primary-700 text-sm rounded-lg border border-primary-200 hover:bg-primary-50 cursor-pointer transition-colors"
                            >
                              📎 {attachment}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card text-center py-12">
            <MegaphoneIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No announcements found</h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'Try adjusting your search terms or filters.'
                : 'Check back later for updates and announcements.'}
            </p>
          </div>
        )}
      </div>

      {/* Mark All as Read */}
      {unreadCount > 0 && (
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary-900">Mark all as read</h3>
              <p className="text-primary-700">You have {unreadCount} unread announcements</p>
            </div>
            <button className="btn-primary">
              Mark All Read
            </button>
          </div>
        </div>
      )}

      {/* Add Update Modal */}
      <AddUpdateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Refresh updates here if you implement real-time loading
          console.log('Update created successfully');
        }}
      />
    </div>
  );
}
