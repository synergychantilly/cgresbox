import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Complaint } from '../types';

// Empty array - complaints will be loaded from Firebase
const mockComplaints: Complaint[] = [];

const categories = [
  { value: 'workplace', label: 'Workplace Issues' },
  { value: 'schedule', label: 'Scheduling' },
  { value: 'equipment', label: 'Equipment & Facilities' },
  { value: 'safety', label: 'Safety Concerns' },
  { value: 'other', label: 'Other' }
];

const severityLevels = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent' }
];

export default function Complaints() {
  const [complaints] = useState<Complaint[]>(mockComplaints);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'reviewing' | 'investigating' | 'resolved' | 'closed'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    category: 'workplace' as const,
    severity: 'medium' as const,
    isAnonymous: false
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      case 'reviewing':
        return 'bg-accent-100 text-accent-700';
      case 'investigating':
        return 'bg-primary-100 text-primary-700';
      case 'resolved':
        return 'bg-secondary-100 text-secondary-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return 'bg-destructive-100 text-destructive-700 border-destructive-200';
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-accent-100 text-accent-700 border-accent-200';
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'reviewing':
      case 'investigating':
        return <ClockIcon className="h-5 w-5" />;
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'closed':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const filteredComplaints = complaints
    .filter(complaint => {
      const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
      const matchesSeverity = filterSeverity === 'all' || complaint.severity === filterSeverity;
      
      return matchesSearch && matchesStatus && matchesSeverity;
    })
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to the backend
    console.log('Submitting complaint:', newComplaint);
    setShowNewComplaint(false);
    setNewComplaint({
      title: '',
      description: '',
      category: 'workplace',
      severity: 'medium',
      isAnonymous: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openCount = complaints.filter(c => ['submitted', 'reviewing', 'investigating'].includes(c.status)).length;
  const urgentCount = complaints.filter(c => c.severity === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Complaints & Issues</h1>
          <p className="text-lg text-gray-600">
            Report concerns and track resolution progress
            {openCount > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary-100 text-primary-700">
                {openCount} open issues
              </span>
            )}
            {urgentCount > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-destructive-100 text-destructive-700 animate-pulse">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {urgentCount} urgent
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowNewComplaint(true)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <PlusIcon className="h-5 w-5" />
          Submit Complaint
        </button>
      </div>

      {/* Important Notice */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Voice Matters</h3>
            <p className="text-blue-800 leading-relaxed">
              We are committed to addressing all concerns promptly and fairly. Anonymous reporting is available, and no retaliation will be tolerated. For urgent safety concerns, contact your supervisor immediately.
            </p>
          </div>
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
              placeholder="Search complaints and issues..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="reviewing">Under Review</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex-1">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
              >
                <option value="all">All Priority Levels</option>
                <option value="urgent">Urgent</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* New Complaint Modal */}
      {showNewComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit a Complaint</h2>
              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newComplaint.title}
                    onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})}
                    placeholder="Brief description of the issue"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Description</label>
                  <textarea
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                    placeholder="Please provide detailed information about the issue, including when it occurred, who was involved, and any other relevant details..."
                    rows={5}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={newComplaint.category}
                      onChange={(e) => setNewComplaint({...newComplaint, category: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority Level</label>
                    <select
                      value={newComplaint.severity}
                      onChange={(e) => setNewComplaint({...newComplaint, severity: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    >
                      {severityLevels.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={newComplaint.isAnonymous}
                      onChange={(e) => setNewComplaint({...newComplaint, isAnonymous: e.target.checked})}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-1"
                    />
                    <div className="ml-3">
                      <label htmlFor="anonymous" className="text-sm font-semibold text-blue-900">
                        Submit anonymously
                      </label>
                      <p className="text-sm text-blue-800 mt-1">
                        Your identity will be kept confidential. Anonymous reports may take longer to investigate as we cannot contact you for additional information.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewComplaint(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit Complaint
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Complaint Details</h2>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="flex flex-wrap gap-4">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(selectedComplaint.status)}`}>
                    {getStatusIcon(selectedComplaint.status)}
                    <span className="font-semibold capitalize">{selectedComplaint.status}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-lg border ${getSeverityColor(selectedComplaint.severity)}`}>
                    <span className="font-semibold capitalize">{selectedComplaint.severity} Priority</span>
                  </div>
                  <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg">
                    <span className="font-semibold">{categories.find(c => c.value === selectedComplaint.category)?.label}</span>
                  </div>
                </div>
                
                {/* Title and Description */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{selectedComplaint.title}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">{selectedComplaint.description}</p>
                  </div>
                </div>
                
                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Submitted:</span>
                    <p className="text-gray-900">{formatDate(selectedComplaint.submittedAt)}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Submitted by:</span>
                    <p className="text-gray-900">
                      {selectedComplaint.isAnonymous ? 'Anonymous' : 'You'}
                    </p>
                  </div>
                  {selectedComplaint.assignedTo && (
                    <div>
                      <span className="font-semibold text-gray-700">Assigned to:</span>
                      <p className="text-gray-900 capitalize">{selectedComplaint.assignedTo}</p>
                    </div>
                  )}
                  {selectedComplaint.resolvedAt && (
                    <div>
                      <span className="font-semibold text-gray-700">Resolved:</span>
                      <p className="text-gray-900">{formatDate(selectedComplaint.resolvedAt)}</p>
                    </div>
                  )}
                </div>
                
                {/* Resolution */}
                {selectedComplaint.resolution && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Resolution</h4>
                    <div className="bg-secondary-50 border border-secondary-200 p-4 rounded-lg">
                      <p className="text-gray-800 leading-relaxed">{selectedComplaint.resolution}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map((complaint) => {
            const severityColors = getSeverityColor(complaint.severity);
            const statusColors = getStatusColor(complaint.status);
            const StatusIcon = getStatusIcon(complaint.status);
            
            return (
              <div
                key={complaint.id}
                className={`card hover:shadow-lg transition-all duration-200 cursor-pointer ${
                  complaint.severity === 'urgent' ? 'ring-2 ring-destructive-200 shadow-md' : ''
                }`}
                onClick={() => setSelectedComplaint(complaint)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${severityColors} flex-shrink-0`}>
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{complaint.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded ${statusColors}`}>
                            {StatusIcon}
                            <span className="font-semibold capitalize">{complaint.status}</span>
                          </div>
                          <span>{categories.find(c => c.value === complaint.category)?.label}</span>
                          <span>{formatDate(complaint.submittedAt)}</span>
                          <span>
                            {complaint.isAnonymous ? 'Anonymous' : 'Your complaint'}
                          </span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${severityColors}`}>
                        {complaint.severity.toUpperCase()}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed line-clamp-3 mb-4">
                      {complaint.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {complaint.assignedTo && (
                          <span>Assigned to {complaint.assignedTo}</span>
                        )}
                        {complaint.status === 'resolved' && complaint.resolvedAt && (
                          <span className="text-secondary-600 font-semibold">
                            Resolved {formatDate(complaint.resolvedAt)}
                          </span>
                        )}
                      </div>
                      <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold">
                        <EyeIcon className="h-4 w-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card text-center py-12">
            <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No complaints found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' || filterSeverity !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'We hope there are no issues to report! Use the button above to submit any concerns.'}
            </p>
            {searchTerm || filterStatus !== 'all' || filterSeverity !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterSeverity('all');
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
