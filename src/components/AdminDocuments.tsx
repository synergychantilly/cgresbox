import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ChartBarIcon,
  FolderIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  LinkIcon,
  HandThumbUpIcon,
  ArrowUturnLeftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { DocumentCategory, DocumentTemplate, UserDocumentStatus } from '../types/documents';
import {
  documentCategoryService,
  documentTemplateService,
  userDocumentService,
  documentUtils,
  webhookEventService
} from '../lib/documentsService';
import AddDocumentCategoryModal from './modals/AddDocumentCategoryModal';
import AddDocumentTemplateModal from './modals/AddDocumentTemplateModal';
import EditDocumentTemplateModal from './modals/EditDocumentTemplateModal';
import { getUsers } from '../lib/userService';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDocuments() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'templates' | 'categories' | 'tracking' | 'debug'>('templates');
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [userDocuments, setUserDocuments] = useState<UserDocumentStatus[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // User tracking state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userTrackingView, setUserTrackingView] = useState<'users' | 'documents'>('users');

  // Modals
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-hide notifications after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, templatesData, userDocsData, usersData] = await Promise.all([
        documentCategoryService.getAll(),
        documentTemplateService.getAll(),
        userDocumentService.getAllUserDocuments(),
        getUsers('approved') // Only get approved users
      ]);
      setCategories(categoriesData);
      setTemplates(templatesData);
      setUserDocuments(userDocsData);
      
      // Filter out admin users, only show regular approved users
      const nonAdminUsers = usersData.filter(user => user.role === 'user');
      setApprovedUsers(nonAdminUsers);
      
      // Debug logging
      console.log('=== LOAD DATA DEBUG ===');
      console.log('All users:', usersData);
      console.log('Non-admin users:', nonAdminUsers);
      console.log('User documents:', userDocsData);
      console.log('Templates:', templatesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const color = category?.color || 'blue';
    return {
      bg: `bg-${color}-100`,
      text: `text-${color}-700`,
      border: `border-${color}-200`
    };
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.title || 'Unknown Document';
  };

  const getStatusIcon = (status: UserDocumentStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'started':
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      case 'viewed':
        return <EyeIcon className="h-5 w-5 text-yellow-600" />;
      case 'declined':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Calculate user statistics
  const getUserStats = (userId: string) => {
    const userDocs = filteredUserDocuments.filter(doc => doc.userId === userId);
    const completed = userDocs.filter(doc => doc.status === 'completed').length;
    const inProgress = userDocs.filter(doc => doc.status === 'started' || doc.status === 'viewed').length;
    const notStarted = userDocs.filter(doc => doc.status === 'not_started').length;
    const overdue = userDocs.filter(doc => documentUtils.isExpired(doc)).length;
    const total = userDocs.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, inProgress, notStarted, overdue, total, completionRate };
  };

  const getSelectedUser = () => {
    return approvedUsers.find(user => user.id === selectedUserId);
  };

  const getSelectedUserDocuments = () => {
    if (!selectedUserId) return [];
    return filteredUserDocuments.filter(doc => doc.userId === selectedUserId);
  };

  const handleManuallyCompleteDocument = async (userDocumentId: string, documentName: string, userName: string) => {
    if (!userData?.id) return;
    
    try {
      await userDocumentService.manuallyCompleteDocument(userDocumentId, userData.id);
      await loadData(); // Refresh data
      showNotification('success', `✅ Successfully marked "${documentName}" as completed for ${userName}`);
    } catch (error) {
      console.error('Error manually completing document:', error);
      showNotification('error', `❌ Failed to mark document as completed. Please try again.`);
    }
  };

  const handleUndoManualCompletion = async (userDocumentId: string, documentName: string, userName: string) => {
    try {
      await userDocumentService.undoManualCompletion(userDocumentId);
      await loadData(); // Refresh data
      showNotification('info', `🔄 Undid manual completion of "${documentName}" for ${userName}`);
    } catch (error) {
      console.error('Error undoing manual completion:', error);
      showNotification('error', `❌ Failed to undo manual completion. Please try again.`);
    }
  };

  // Filter user documents to only include non-admin users
  const nonAdminUserIds = new Set(approvedUsers.map(user => user.id));
  const filteredUserDocuments = userDocuments.filter(doc => nonAdminUserIds.has(doc.userId));
  
  // Filter functions
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredUsers = approvedUsers.filter(user => {
    return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredUserDocumentsForTable = getSelectedUserDocuments().filter(doc => {
    const matchesSearch = getTemplateName(doc.documentTemplateId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const totalUsers = approvedUsers.length;
  const completedDocs = filteredUserDocuments.filter(doc => doc.status === 'completed').length;
  const pendingDocs = filteredUserDocuments.filter(doc => doc.status === 'not_started' || doc.status === 'viewed' || doc.status === 'started').length;
  const overdueDocs = filteredUserDocuments.filter(doc => documentUtils.isExpired(doc)).length;
  const completionRate = filteredUserDocuments.length > 0 ? Math.round((completedDocs / filteredUserDocuments.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-lg text-gray-600">
            Manage document templates, categories, and track user progress
          </p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div 
          className={`relative px-4 py-3 rounded-lg border-l-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-400 text-green-700' 
              : notification.type === 'error'
              ? 'bg-red-50 border-red-400 text-red-700'
              : 'bg-blue-50 border-blue-400 text-blue-700'
          } flex justify-between items-center animate-in slide-in-from-top-2 duration-300`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-current opacity-70 hover:opacity-100 ml-4"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedDocs}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingDocs}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{overdueDocs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Overall Completion Rate</h3>
          <span className="text-2xl font-bold text-primary-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 inline mr-2" />
            Document Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderIcon className="h-5 w-5 inline mr-2" />
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tracking'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 inline mr-2" />
            User Tracking ({approvedUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'debug'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
            Debug & Sync
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Templates Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowAddTemplate(true)}
                className="btn-primary flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Add Template
              </button>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const categoryColors = getCategoryColor(template.categoryId);
              return (
                <div key={template.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {template.title}
                      </h3>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text} ${categoryColors.border} border`}>
                        <FolderIcon className="h-3 w-3 mr-1" />
                        {getCategoryName(template.categoryId)}
                      </div>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {template.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Template ID:</span>
                      <span className="font-mono text-primary-600 bg-primary-50 px-2 py-1 rounded text-xs">
                        {template.docusealTemplateId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Required:</span>
                      <span className={template.isRequired ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                        {template.isRequired ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reminder:</span>
                      <span>{template.reminderDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valid for:</span>
                      <span>{template.expiryDays} days</span>
                    </div>
                  </div>

                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <a
                      href={template.docusealLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View DocuSeal
                    </a>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowEditTemplate(true);
                        }}
                        className="text-gray-400 hover:text-blue-600"
                        title="Edit template"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this template?')) {
                            documentTemplateService.delete(template.id).then(loadData);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete template"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No document templates found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterCategory !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first document template to get started.'}
              </p>
              <button
                onClick={() => setShowAddTemplate(true)}
                className="btn-primary"
              >
                Add Document Template
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Categories Header */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddCategory(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Category
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const templatesInCategory = templates.filter(t => t.categoryId === category.id);
              const color = category.color || 'blue';
              return (
                <div key={category.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-4 h-4 rounded-full bg-${color}-500 flex-shrink-0 mt-1`}></div>
                    <div className="flex gap-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-red-600">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>

                  {category.description && (
                    <p className="text-gray-600 text-sm mb-4">
                      {category.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{templatesInCategory.length} template{templatesInCategory.length !== 1 ? 's' : ''}</span>
                    <span>{new Date(category.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-600 mb-4">
                Create categories to organize your document templates.
              </p>
              <button
                onClick={() => setShowAddCategory(true)}
                className="btn-primary"
              >
                Add Category
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="space-y-6">
          {!selectedUserId ? (
            // Users List View
            <>
              {/* Users Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                </div>
              </div>

              {/* Users Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => {
                  const stats = getUserStats(user.id);
                  return (
                    <div 
                      key={user.id} 
                      className="card hover:shadow-lg transition-all cursor-pointer border hover:border-primary-300"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-sm">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary-600">{stats.completionRate}%</div>
                          <div className="text-xs text-gray-500">Complete</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.completionRate}%` }}
                        ></div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-green-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-green-600">{stats.completed}</div>
                          <div className="text-xs text-green-700">Completed</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-blue-600">{stats.inProgress}</div>
                          <div className="text-xs text-blue-700">In Progress</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-gray-600">{stats.notStarted}</div>
                          <div className="text-xs text-gray-700">Not Started</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-red-600">{stats.overdue}</div>
                          <div className="text-xs text-red-700">Overdue</div>
                        </div>
                      </div>

                      <div className="mt-4 text-center">
                        <span className="text-sm text-gray-500">
                          {stats.total} total document{stats.total !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">
                    {searchTerm
                      ? 'Try adjusting your search terms.'
                      : 'No approved users available for tracking.'}
                  </p>
                </div>
              )}
            </>
          ) : (
            // User Detail View
            <>
              {/* User Detail Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setSelectedUserId(null);
                      setSearchTerm('');
                      setFilterStatus('all');
                    }}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
                  >
                    ← Back to Users
                  </button>
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {getSelectedUser()?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{getSelectedUser()?.name}</h2>
                    <p className="text-gray-600">{getSelectedUser()?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">
                    {getUserStats(selectedUserId).completionRate}%
                  </div>
                  <div className="text-sm text-gray-500">Overall Progress</div>
                </div>
              </div>

              {/* Manual Completion Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Manual Document Completion</h4>
                <p className="text-blue-800 text-sm">
                  You can manually mark documents as completed for users. Manually completed documents will:
                </p>
                <ul className="text-blue-700 text-sm mt-2 space-y-1 ml-4">
                  <li>• Be marked as "Completed" in admin tracking</li>
                  <li>• Be completely hidden from the user's document queue</li>
                  <li>• Show a "Manually Completed" badge for admin reference</li>
                  <li>• Can be undone if needed</li>
                </ul>
              </div>

              {/* User Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(() => {
                  const stats = getUserStats(selectedUserId);
                  return (
                    <>
                      <div className="card text-center bg-green-50 border-green-200">
                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                        <div className="text-sm text-green-700">Completed</div>
                      </div>
                      <div className="card text-center bg-blue-50 border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                        <div className="text-sm text-blue-700">In Progress</div>
                      </div>
                      <div className="card text-center bg-gray-50 border-gray-200">
                        <div className="text-2xl font-bold text-gray-600">{stats.notStarted}</div>
                        <div className="text-sm text-gray-700">Not Started</div>
                      </div>
                      <div className="card text-center bg-red-50 border-red-200">
                        <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                        <div className="text-sm text-red-700">Overdue</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Document Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="not_started">Not Started</option>
                  <option value="viewed">Viewed</option>
                  <option value="started">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="declined">Declined</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Documents Table */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUserDocumentsForTable.map((doc) => {
                        const template = templates.find(t => t.id === doc.documentTemplateId);
                        const categoryColors = template ? getCategoryColor(template.categoryId) : { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
                        
                        return (
                          <tr key={doc.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 max-w-xs line-clamp-2">
                                {getTemplateName(doc.documentTemplateId)}
                              </div>
                              {template?.isRequired && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mt-1">
                                  Required
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text} ${categoryColors.border} border`}>
                                {template ? getCategoryName(template.categoryId) : 'Unknown'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${documentUtils.getStatusColor(doc.status)}`}>
                                  {getStatusIcon(doc.status)}
                                  <span className="ml-1">{documentUtils.getStatusText(doc.status)}</span>
                                </div>
                                {doc.isManuallyCompleted && (
                                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                    <HandThumbUpIcon className="h-3 w-3 mr-1" />
                                    Manually Completed
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {doc.completedAt && new Date(doc.completedAt).toLocaleDateString()}
                              {doc.startedAt && !doc.completedAt && new Date(doc.startedAt).toLocaleDateString()}
                              {doc.viewedAt && !doc.startedAt && new Date(doc.viewedAt).toLocaleDateString()}
                              {!doc.viewedAt && '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      doc.status === 'completed' ? 'bg-green-500' :
                                      doc.status === 'started' ? 'bg-blue-500' :
                                      doc.status === 'viewed' ? 'bg-yellow-500' :
                                      doc.status === 'declined' ? 'bg-red-500' :
                                      'bg-gray-300'
                                    }`}
                                    style={{
                                      width: `${
                                        doc.status === 'completed' ? 100 :
                                        doc.status === 'started' ? 60 :
                                        doc.status === 'viewed' ? 30 :
                                        doc.status === 'declined' ? 100 :
                                        0
                                      }%`
                                    }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-sm text-gray-600">
                                  {doc.status === 'completed' ? '100%' :
                                   doc.status === 'started' ? '60%' :
                                   doc.status === 'viewed' ? '30%' :
                                   doc.status === 'declined' ? 'N/A' :
                                   '0%'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-2">
                                {/* Existing document actions */}
                                {doc.status === 'completed' && doc.completedDocumentUrl && (
                                  <a
                                    href={doc.completedDocumentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                                    title={`View completed document: ${doc.completedDocumentName || 'Document'}`}
                                  >
                                    <DocumentArrowDownIcon className="h-4 w-4" />
                                    View PDF
                                  </a>
                                )}
                                {doc.auditLogUrl && (
                                  <a
                                    href={doc.auditLogUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                                    title="View audit log"
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                    Audit
                                  </a>
                                )}
                                {doc.submissionUrl && (
                                  <a
                                    href={doc.submissionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-gray-700 flex items-center gap-1 text-sm"
                                    title="View DocuSeal submission"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                    DocuSeal
                                  </a>
                                )}
                                
                                {/* Manual completion actions */}
                                {doc.status !== 'completed' && (
                                  <button
                                    onClick={() => {
                                      const documentName = getTemplateName(doc.documentTemplateId);
                                      const userName = getSelectedUser()?.name || 'User';
                                      handleManuallyCompleteDocument(doc.id, documentName, userName);
                                    }}
                                    className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm bg-green-50 hover:bg-green-100 px-2 py-1 rounded border border-green-200 transition-colors"
                                    title="Mark as completed manually"
                                  >
                                    <HandThumbUpIcon className="h-4 w-4" />
                                    Mark Complete
                                  </button>
                                )}
                                
                                {doc.status === 'completed' && doc.isManuallyCompleted && (
                                  <button
                                    onClick={() => {
                                      const documentName = getTemplateName(doc.documentTemplateId);
                                      const userName = getSelectedUser()?.name || 'User';
                                      handleUndoManualCompletion(doc.id, documentName, userName);
                                    }}
                                    className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-sm bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded border border-orange-200 transition-colors"
                                    title="Undo manual completion"
                                  >
                                    <ArrowUturnLeftIcon className="h-4 w-4" />
                                    Undo
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredUserDocumentsForTable.length === 0 && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterStatus !== 'all'
                      ? 'Try adjusting your search or filters.'
                      : 'This user has no documents assigned.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'debug' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug & Sync Tools</h3>
            <p className="text-yellow-700 mb-4">
              Use these tools to troubleshoot and sync document status data. These operations are safe but may take time for large datasets.
            </p>
          </div>

          {/* Sync Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Sync User Documents</h4>
              <p className="text-gray-600 mb-4">
                Ensures all approved users have entries for all document templates with default "not_started" status.
              </p>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    try {
                      showNotification('info', '⏳ Synchronizing user documents...');
                      await userDocumentService.syncAllUserDocuments();
                      await loadData(); // Refresh data
                      showNotification('success', '✅ User documents synchronized successfully!');
                    } catch (error) {
                      console.error('Sync error:', error);
                      showNotification('error', '❌ Failed to sync user documents. Check console for details.');
                    }
                  }}
                  className="btn-primary"
                >
                  Sync All User Documents
                </button>
                <button
                  onClick={async () => {
                    try {
                      console.log('=== DEBUG INFO ===');
                      console.log('Approved users:', approvedUsers);
                      console.log('All user documents:', userDocuments);
                      console.log('Templates:', templates);
                      console.log('Expected entries:', approvedUsers.length * templates.length);
                      console.log('Actual entries:', userDocuments.length);
                      
                      // Check which users are missing documents
                      const usersWithoutDocs = approvedUsers.filter(user => 
                        !userDocuments.some(doc => doc.userId === user.id)
                      );
                      console.log('Users without any documents:', usersWithoutDocs);
                      
                      showNotification('info', `🔍 Debug info logged to console. Expected: ${approvedUsers.length * templates.length}, Actual: ${userDocuments.length} entries`);
                    } catch (error) {
                      console.error('Debug error:', error);
                      showNotification('error', '❌ Debug failed. Check console for details.');
                    }
                  }}
                  className="btn-secondary"
                >
                  Debug User Documents
                </button>
              </div>
            </div>

            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Webhook Events</h4>
              <p className="text-gray-600 mb-4">
                Check recent webhook events to debug status tracking issues. 
              </p>
              <button
                onClick={async () => {
                  try {
                    // Get recent webhook events
                    const events = await webhookEventService.getRecentEvents(20);
                    console.log('Recent webhook events:', events);
                    
                    if (events.length === 0) {
                      showNotification('info', '⚠️ No webhook events found. Make sure DocuSeal is configured to send webhooks.');
                    } else {
                      showNotification('success', `📡 Found ${events.length} recent webhook events. Check browser console for details.`);
                    }
                  } catch (error) {
                    console.error('Error fetching webhook events:', error);
                    showNotification('error', '❌ Failed to fetch webhook events. Check console for details.');
                  }
                }}
                className="btn-secondary"
              >
                Check Recent Webhooks
              </button>
            </div>
          </div>

          {/* Webhook URL Info */}
          <div className="card bg-blue-50 border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">Webhook Configuration</h4>
            <p className="text-blue-800 mb-3">
              Make sure DocuSeal is configured to send webhooks to:
            </p>
            <div className="bg-blue-100 rounded p-3 font-mono text-sm text-blue-900 mb-4">
              https://us-central1-caregiver-resource-box.cloudfunctions.net/docusealWebhook
            </div>
            <p className="text-blue-700 text-sm">
              Required events: <strong>form.viewed</strong>, <strong>form.started</strong>, <strong>submission.created</strong>, 
              <strong>submission.completed</strong>, <strong>form.completed</strong>, <strong>form.declined</strong>
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{approvedUsers.length}</div>
              <div className="text-sm text-gray-600">Approved Users</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
              <div className="text-sm text-gray-600">Document Templates</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{filteredUserDocuments.length}</div>
              <div className="text-sm text-gray-600">User Document Entries</div>
              <div className="text-xs text-gray-500 mt-1">
                Expected: {approvedUsers.length * templates.length}
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {['not_started', 'viewed', 'started', 'completed', 'declined', 'expired'].map(status => {
                const count = filteredUserDocuments.filter(doc => doc.status === status).length;
                const percentage = filteredUserDocuments.length > 0 ? Math.round((count / filteredUserDocuments.length) * 100) : 0;
                return (
                  <div key={status} className="text-center">
                    <div className="text-xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">{documentUtils.getStatusText(status as any)}</div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddDocumentCategoryModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSuccess={loadData}
      />

      <AddDocumentTemplateModal
        isOpen={showAddTemplate}
        onClose={() => setShowAddTemplate(false)}
        onSuccess={loadData}
      />

      <EditDocumentTemplateModal
        isOpen={showEditTemplate}
        onClose={() => {
          setShowEditTemplate(false);
          setEditingTemplate(null);
        }}
        onSuccess={loadData}
        template={editingTemplate}
      />
    </div>
  );
}
