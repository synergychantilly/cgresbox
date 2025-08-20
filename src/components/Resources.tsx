import React, { useState } from 'react';
import {
  FolderIcon,
  DocumentTextIcon,
  PlayCircleIcon,
  LinkIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { Resource } from '../types';
import { Resource as NewResource } from '../types/resources';
import { useAuth } from '../contexts/AuthContext';
import AddResourceModal from './modals/AddResourceModal';

// Empty array - resources will be loaded from Firebase
const mockResources: Resource[] = [];

const categories = ['All', 'Policies', 'Training', 'Clinical', 'Administrative', 'Safety', 'Development', 'Wellness', 'Scheduling'];
const resourceTypes = ['All', 'Document', 'Image', 'Resource', 'URL'];

export default function Resources() {
  const { isAdmin } = useAuth();
  const [resources] = useState<Resource[]>(mockResources);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'name'>('recent');
  const [showAddModal, setShowAddModal] = useState(false);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <DocumentTextIcon className="h-8 w-8" />;
      case 'video':
        return <PlayCircleIcon className="h-8 w-8" />;
      case 'link':
        return <LinkIcon className="h-8 w-8" />;
      case 'form':
        return <DocumentArrowDownIcon className="h-8 w-8" />;
      case 'policy':
        return <FolderIcon className="h-8 w-8" />;
      default:
        return <DocumentTextIcon className="h-8 w-8" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'document':
        return 'text-primary-600 bg-primary-100';
      case 'video':
        return 'text-destructive-600 bg-destructive-100';
      case 'link':
        return 'text-accent-600 bg-accent-100';
      case 'form':
        return 'text-secondary-600 bg-secondary-100';
      case 'policy':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredAndSortedResources = resources
    .filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
      const matchesType = selectedType === 'All' || resource.type === selectedType;
      
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloadCount - a.downloadCount;
        case 'name':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleResourceClick = (resource: Resource) => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    } else if ((resource as any).fileUrl) {
      // In a real app, this would trigger a download or open the file
      console.log('Downloading:', (resource as any).fileUrl);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources Library</h1>
          <p className="text-lg text-gray-600">
            Access documents, training materials, and important information
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-primary-100 text-primary-700">
            {filteredAndSortedResources.length} Resources Available
          </span>
          {isAdmin && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <CloudArrowUpIcon className="h-5 w-5" />
              Upload Resource
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search resources, documents, and training materials..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              >
                {resourceTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'All' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredAndSortedResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedResources.map((resource) => {
            const iconColor = getResourceColor(resource.type);
            const Icon = getResourceIcon(resource.type);

            return (
              <div
                key={resource.id}
                onClick={() => handleResourceClick(resource)}
                className="card hover:shadow-lg cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${iconColor} group-hover:scale-110 transition-transform`}>
                    {Icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {resource.category} • {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3 leading-relaxed">
                  {resource.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {resource.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{resource.tags.length - 3} more</span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <span>Updated {formatDate(resource.updatedAt)}</span>
                    <span>{resource.downloadCount} downloads</span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    ['Image', 'video'].includes(resource.type) ? 'bg-destructive-100 text-destructive-700' :
                    ['URL', 'link'].includes(resource.type) ? 'bg-accent-100 text-accent-700' :
                    'bg-primary-100 text-primary-700'
                  }`}>
                    {['URL', 'link'].includes(resource.type) ? 'External Link' : 
                     ['Image', 'video'].includes(resource.type) ? 'Media File' : 'Download'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory !== 'All' || selectedType !== 'All'
              ? 'Try adjusting your search terms or filters.'
              : 'Resources will appear here when they become available.'}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedType('All');
            }}
            className="btn-primary mt-4"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Popular Categories */}
      <div className="card bg-gradient-to-r from-primary-50 to-secondary-50">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(1).map((category) => {
            const categoryCount = resources.filter(r => r.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <h3 className="font-semibold text-gray-900">{category}</h3>
                <p className="text-sm text-gray-600">{categoryCount} resources</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Resource Modal */}
      <AddResourceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Refresh resources here if you implement real-time loading
          console.log('Resource created successfully');
        }}
      />
    </div>
  );
}
