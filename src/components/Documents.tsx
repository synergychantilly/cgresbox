import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  TagIcon,
  DocumentArrowDownIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { DocumentCategory, DocumentTemplate, UserDocumentStatus } from '../types/documents';
import {
  documentCategoryService,
  documentTemplateService,
  userDocumentService,
  documentUtils
} from '../lib/documentsService';
import { useAuth } from '../contexts/AuthContext';

export default function Documents() {
  const { userData } = useAuth();
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [userDocuments, setUserDocuments] = useState<UserDocumentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<{ template: DocumentTemplate; status: UserDocumentStatus } | null>(null);

  useEffect(() => {
    loadData();
  }, [userData]);

  const loadData = async () => {
    if (!userData) return;
    
    setLoading(true);
    try {
      const [categoriesData, templatesData, userDocsData] = await Promise.all([
        documentCategoryService.getAll(),
        documentTemplateService.getAll(),
        userDocumentService.getUserDocuments(userData.id)
      ]);
      setCategories(categoriesData);
      setTemplates(templatesData);
      setUserDocuments(userDocsData);
    } catch (error) {
      console.error('Error loading documents:', error);
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

  const getDocumentStatus = (templateId: string) => {
    return userDocuments.find(doc => doc.documentTemplateId === templateId);
  };

  const getStatusIcon = (status: UserDocumentStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'started':
        return <ClockIcon className="h-5 w-5" />;
      case 'viewed':
        return <EyeIcon className="h-5 w-5" />;
      case 'declined':
        return <XCircleIcon className="h-5 w-5" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  // Filter documents based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.categoryId === filterCategory;
    
    if (filterStatus !== 'all') {
      const status = getDocumentStatus(template.id);
      const currentStatus = status?.status || 'not_started';
      if (filterStatus !== currentStatus) {
        return false;
      }
    }
    
    return matchesSearch && matchesCategory;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate statistics
  const notStartedCount = userDocuments.filter(d => d.status === 'not_started').length;
  const completedCount = userDocuments.filter(d => d.status === 'completed').length;
  const inProgressCount = userDocuments.filter(d => d.status === 'started' || d.status === 'viewed').length;
  const overdue = userDocuments.filter(d => documentUtils.isExpired(d)).length;
  const expiringSoon = userDocuments.filter(d => documentUtils.isExpiringSoon(d)).length;

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
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="text-lg text-gray-600">
            Complete required documentation and track your progress
            {notStartedCount > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                {notStartedCount} not started
              </span>
            )}
            {overdue > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                {overdue} overdue
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Not Started</p>
              <p className="text-2xl font-bold text-gray-900">{notStartedCount}</p>
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
              <p className="text-2xl font-bold text-gray-900">{overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(overdue > 0 || expiringSoon > 0) && (
        <div className="space-y-3">
          {overdue > 0 && (
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Overdue Documents</h3>
                  <p className="text-red-800">
                    You have {overdue} overdue document{overdue !== 1 ? 's' : ''}. Please complete them immediately to maintain compliance.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {expiringSoon > 0 && (
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">Expiring Soon</h3>
                  <p className="text-yellow-800">
                    {expiringSoon} document{expiringSoon !== 1 ? 's' : ''} will expire within 30 days. Plan ahead to avoid any disruptions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
              placeholder="Search documents by title or description..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
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
          </div>
        </div>
      </div>



      {/* Document Details Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Document Details</h2>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Status */}
                <div className="flex flex-wrap gap-3">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    documentUtils.getStatusColor(selectedDocument.status.status)
                  }`}>
                    {getStatusIcon(selectedDocument.status.status)}
                    <span className="font-semibold capitalize">
                      {documentUtils.getStatusText(selectedDocument.status.status)}
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg">
                    <span className="font-semibold">
                      <FolderIcon className="h-4 w-4 inline mr-1" />
                      {getCategoryName(selectedDocument.template.categoryId)}
                    </span>
                  </div>
                </div>
                
                {/* Title and Description */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedDocument.template.title}</h3>
                  {selectedDocument.template.description && (
                    <p className="text-gray-700">{selectedDocument.template.description}</p>
                  )}
                </div>
                
                {/* Progress Timeline */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Progress Timeline</h4>
                  <div className="space-y-2 text-sm">
                    {selectedDocument.status.viewedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Viewed:</span>
                        <span className="text-gray-900">{formatDate(selectedDocument.status.viewedAt)}</span>
                      </div>
                    )}
                    {selectedDocument.status.startedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span className="text-gray-900">{formatDate(selectedDocument.status.startedAt)}</span>
                      </div>
                    )}
                    {selectedDocument.status.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="text-green-600 font-semibold">{formatDate(selectedDocument.status.completedAt)}</span>
                      </div>
                    )}
                    {selectedDocument.status.declinedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Declined:</span>
                        <span className="text-red-600 font-semibold">{formatDate(selectedDocument.status.declinedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Required:</span>
                    <p className={selectedDocument.template.isRequired ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                      {selectedDocument.template.isRequired ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Valid for:</span>
                    <p className="text-gray-900">{selectedDocument.template.expiryDays} days</p>
                  </div>
                  {selectedDocument.status.expiresAt && (
                    <div className="md:col-span-2">
                      <span className="font-semibold text-gray-700">Expires:</span>
                      <p className={`font-semibold ${
                        documentUtils.isExpired(selectedDocument.status) ? 'text-red-600' :
                        documentUtils.isExpiringSoon(selectedDocument.status) ? 'text-yellow-600' : 'text-gray-900'
                      }`}>
                        {formatDate(selectedDocument.status.expiresAt)}
                        {documentUtils.isExpired(selectedDocument.status) && ' (EXPIRED)'}
                        {documentUtils.isExpiringSoon(selectedDocument.status) && !documentUtils.isExpired(selectedDocument.status) && ' (Expiring Soon)'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {selectedDocument.template.tags && selectedDocument.template.tags.length > 0 && (
                  <div>
                    <span className="font-semibold text-gray-700 block mb-2">Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.template.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  {selectedDocument.status.status === 'completed' && selectedDocument.status.completedDocumentUrl ? (
                    <div className="flex gap-3 w-full">
                      <a
                        href={selectedDocument.status.completedDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center gap-2"
                        title={`Download completed document: ${selectedDocument.status.completedDocumentName || selectedDocument.template.title}`}
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        View Completed PDF
                      </a>
                      {selectedDocument.status.auditLogUrl && (
                        <a
                          href={selectedDocument.status.auditLogUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center gap-2"
                          title="View audit log"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Audit Log
                        </a>
                      )}
                    </div>
                  ) : (
                    <a
                      href={selectedDocument.template.docusealLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex items-center gap-2"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      Open Document
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => {
            const status = getDocumentStatus(template.id);
            const currentStatus = status?.status || 'not_started';
            const isExpired = status ? documentUtils.isExpired(status) : false;
            const expiringSoon = status ? documentUtils.isExpiringSoon(status) : false;
            const categoryColors = getCategoryColor(template.categoryId);
            
            return (
              <div
                key={template.id}
                onClick={() => status && setSelectedDocument({ template, status })}
                className={`card hover:shadow-lg cursor-pointer transition-all duration-200 ${
                  isExpired ? 'ring-2 ring-red-200' :
                  expiringSoon ? 'ring-2 ring-yellow-200' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {template.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text} ${categoryColors.border} border`}>
                        <FolderIcon className="h-3 w-3 mr-1" />
                        {getCategoryName(template.categoryId)}
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${documentUtils.getStatusColor(currentStatus)}`}>
                        {getStatusIcon(currentStatus)}
                        <span>{documentUtils.getStatusText(currentStatus)}</span>
                      </div>
                    </div>
                  </div>
                  {template.isRequired && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                      Required
                    </span>
                  )}
                </div>
                
                {template.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {template.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>
                      {currentStatus === 'completed' ? '100%' :
                       currentStatus === 'started' ? '60%' :
                       currentStatus === 'viewed' ? '30%' :
                       currentStatus === 'declined' ? 'N/A' :
                       '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentStatus === 'completed' ? 'bg-green-500' :
                        currentStatus === 'started' ? 'bg-blue-500' :
                        currentStatus === 'viewed' ? 'bg-yellow-500' :
                        currentStatus === 'declined' ? 'bg-red-500' :
                        'bg-gray-300'
                      }`}
                      style={{
                        width: `${
                          currentStatus === 'completed' ? 100 :
                          currentStatus === 'started' ? 60 :
                          currentStatus === 'viewed' ? 30 :
                          currentStatus === 'declined' ? 100 :
                          0
                        }%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Tags */}
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{template.tags.length - 3} more</span>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Valid for {template.expiryDays} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const docStatus = getDocumentStatus(template.id);
                      return docStatus?.status === 'completed' && docStatus.completedDocumentUrl ? (
                        <a
                          href={docStatus.completedDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-700 font-semibold text-sm flex items-center gap-1"
                          title={`View completed document: ${docStatus.completedDocumentName || template.title}`}
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                          View PDF
                        </a>
                      ) : (
                        <a
                          href={template.docusealLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          Open
                        </a>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full">
            <div className="card text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search terms or filters.'
                  : 'No documents have been assigned to you yet.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
