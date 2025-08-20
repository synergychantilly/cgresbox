import React, { useState } from 'react';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Document } from '../types';

// Empty array - documents will be loaded from Firebase
const mockDocuments: Document[] = [];

const documentTypes = [
  { value: 'certification', label: 'Certifications' },
  { value: 'training', label: 'Training Records' },
  { value: 'medical', label: 'Medical Records' },
  { value: 'timesheet', label: 'Timesheets' },
  { value: 'other', label: 'Other Documents' }
];

export default function Documents() {
  const [documents] = useState<Document[]>(mockDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'certification' | 'training' | 'medical' | 'timesheet' | 'other'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'expired'>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const [newDocument, setNewDocument] = useState({
    title: '',
    type: 'other' as const,
    description: '',
    expiryDate: '',
    file: null as File | null
  });

  const getStatusColor = (status: string, expiryDate?: Date) => {
    if (expiryDate && expiryDate < new Date()) {
      return 'bg-destructive-100 text-destructive-700 border-destructive-200';
    }
    switch (status) {
      case 'approved':
        return 'bg-secondary-100 text-secondary-700 border-secondary-200';
      case 'pending':
        return 'bg-accent-100 text-accent-700 border-accent-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string, expiryDate?: Date) => {
    if (expiryDate && expiryDate < new Date()) {
      return <ExclamationTriangleIcon className="h-5 w-5" />;
    }
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'certification':
        return '📜';
      case 'training':
        return '🎓';
      case 'medical':
        return '🏥';
      case 'timesheet':
        return '⏰';
      default:
        return '📄';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpiringSoon = (expiryDate: Date) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  };

  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || doc.type === filterType;
      let matchesStatus = true;
      
      if (filterStatus !== 'all') {
        if (filterStatus === 'expired') {
          matchesStatus = doc.expiryDate ? doc.expiryDate < new Date() : false;
        } else {
          matchesStatus = doc.status === filterStatus;
        }
      }
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would upload to the server
    console.log('Uploading document:', newDocument);
    setShowUpload(false);
    setNewDocument({
      title: '',
      type: 'other',
      description: '',
      expiryDate: '',
      file: null
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDocument({...newDocument, file: e.target.files[0]});
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const expiredCount = documents.filter(d => d.expiryDate && d.expiryDate < new Date()).length;
  const expiringSoonCount = documents.filter(d => d.expiryDate && isExpiringSoon(d.expiryDate) && d.expiryDate >= new Date()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="text-lg text-gray-600">
            Manage your certifications, training records, and required documentation
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-accent-100 text-accent-700">
                {pendingCount} pending review
              </span>
            )}
            {expiredCount > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-destructive-100 text-destructive-700">
                {expiredCount} expired
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <CloudArrowUpIcon className="h-5 w-5" />
          Upload Document
        </button>
      </div>

      {/* Alerts */}
      {(expiredCount > 0 || expiringSoonCount > 0) && (
        <div className="space-y-3">
          {expiredCount > 0 && (
            <div className="card bg-destructive-50 border-destructive-200">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-destructive-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-destructive-900 mb-2">Expired Documents</h3>
                  <p className="text-destructive-800">
                    You have {expiredCount} expired document{expiredCount !== 1 ? 's' : ''}. Please renew or replace them immediately to maintain your employment status.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {expiringSoonCount > 0 && (
            <div className="card bg-accent-50 border-accent-200">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-6 w-6 text-accent-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-accent-900 mb-2">Expiring Soon</h3>
                  <p className="text-accent-800">
                    {expiringSoonCount} document{expiringSoonCount !== 1 ? 's' : ''} will expire within 30 days. Plan ahead to avoid any disruptions.
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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              >
                <option value="all">All Document Types</option>
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Document</h2>
              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Document Title</label>
                  <input
                    type="text"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                    placeholder="e.g., CPR Certification, Training Certificate"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Document Type</label>
                  <select
                    value={newDocument.type}
                    onChange={(e) => setNewDocument({...newDocument, type: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  >
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    value={newDocument.description}
                    onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                    placeholder="Brief description of the document"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date (If Applicable)</label>
                  <input
                    type="date"
                    value={newDocument.expiryDate}
                    onChange={(e) => setNewDocument({...newDocument, expiryDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select File</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Accepted formats: PDF, Word documents, images (JPG, PNG). Max size: 5MB
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Upload Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
                    getStatusColor(selectedDocument.status, selectedDocument.expiryDate)
                  }`}>
                    {getStatusIcon(selectedDocument.status, selectedDocument.expiryDate)}
                    <span className="font-semibold capitalize">
                      {selectedDocument.expiryDate && selectedDocument.expiryDate < new Date() ? 'Expired' : selectedDocument.status}
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg">
                    <span className="font-semibold">
                      {getTypeIcon(selectedDocument.type)} {documentTypes.find(t => t.value === selectedDocument.type)?.label}
                    </span>
                  </div>
                </div>
                
                {/* Title and Description */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedDocument.title}</h3>
                  {selectedDocument.description && (
                    <p className="text-gray-700">{selectedDocument.description}</p>
                  )}
                </div>
                
                {/* File Info */}
                {selectedDocument.fileName && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <DocumentTextIcon className="h-6 w-6 text-gray-600" />
                      <span className="font-semibold text-gray-900">{selectedDocument.fileName}</span>
                    </div>
                    <p className="text-sm text-gray-600">Size: {formatFileSize(selectedDocument.fileSize)}</p>
                  </div>
                )}
                
                {/* Dates and Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Uploaded:</span>
                    <p className="text-gray-900">{formatDate(selectedDocument.uploadedAt)}</p>
                  </div>
                  {selectedDocument.expiryDate && (
                    <div>
                      <span className="font-semibold text-gray-700">Expires:</span>
                      <p className={`font-semibold ${
                        selectedDocument.expiryDate < new Date() ? 'text-destructive-600' :
                        isExpiringSoon(selectedDocument.expiryDate) ? 'text-accent-600' : 'text-gray-900'
                      }`}>
                        {formatDate(selectedDocument.expiryDate)}
                        {selectedDocument.expiryDate < new Date() && ' (EXPIRED)'}
                        {isExpiringSoon(selectedDocument.expiryDate) && selectedDocument.expiryDate >= new Date() && ' (Expiring Soon)'}
                      </p>
                    </div>
                  )}
                  {selectedDocument.requiredFor && selectedDocument.requiredFor.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="font-semibold text-gray-700">Required for:</span>
                      <p className="text-gray-900">{selectedDocument.requiredFor.join(', ')}</p>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  {selectedDocument.fileUrl && (
                    <button className="btn-primary flex items-center gap-2">
                      <EyeIcon className="h-4 w-4" />
                      View Document
                    </button>
                  )}
                  <button className="btn-secondary flex items-center gap-2">
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((document) => {
            const isExpired = document.expiryDate && document.expiryDate < new Date();
            const expiringSoon = document.expiryDate && isExpiringSoon(document.expiryDate) && !isExpired;
            const statusColors = getStatusColor(document.status, document.expiryDate);
            const StatusIcon = getStatusIcon(document.status, document.expiryDate);
            
            return (
              <div
                key={document.id}
                onClick={() => setSelectedDocument(document)}
                className={`card hover:shadow-lg cursor-pointer transition-all duration-200 ${
                  isExpired ? 'ring-2 ring-destructive-200' :
                  expiringSoon ? 'ring-2 ring-accent-200' : ''
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-3xl flex-shrink-0">
                    {getTypeIcon(document.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {document.title}
                    </h3>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold w-fit border ${statusColors}`}>
                      {StatusIcon}
                      <span className="capitalize">
                        {isExpired ? 'Expired' : document.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {document.description && (
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {document.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span>{formatDate(document.uploadedAt)}</span>
                  </div>
                  
                  {document.expiryDate && (
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span className={`font-semibold ${
                        isExpired ? 'text-destructive-600' :
                        expiringSoon ? 'text-accent-600' : 'text-gray-600'
                      }`}>
                        {formatDate(document.expiryDate)}
                      </span>
                    </div>
                  )}
                  
                  {document.fileName && (
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{formatFileSize(document.fileSize)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {documentTypes.find(t => t.value === document.type)?.label}
                  </span>
                  <button className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1">
                    <EyeIcon className="h-4 w-4" />
                    View
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full">
            <div className="card text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search terms or filters.'
                  : 'Upload your first document to get started.'}
              </p>
              <button
                onClick={() => setShowUpload(true)}
                className="btn-primary"
              >
                Upload Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
