import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  CalendarIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { Complaint } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { complaintsService } from '../lib/complaintsService';

const categories = [
  { value: 'workplace', label: 'Workplace Issues' },
  { value: 'schedule', label: 'Scheduling' },
  { value: 'equipment', label: 'Equipment & Facilities' },
  { value: 'safety', label: 'Safety Concerns' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'discrimination', label: 'Discrimination' },
  { value: 'other', label: 'Other' }
];

export default function Complaints() {
  const { userData, isAdmin } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'reviewing' | 'investigating' | 'resolved' | 'closed'>('submitted');
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [newComplaint, setNewComplaint] = useState({
    topic: '',
    description: '',
    isAboutSomeone: false,
    whoIsThisAbout: '',
    dateOfIncidence: '',
    dateUnknown: false,
    category: 'workplace' as const,
    isAnonymous: false
  });

  // Load complaints based on user role
  useEffect(() => {
    loadComplaints();
  }, [userData, isAdmin]);

  const loadComplaints = async () => {
    if (!userData) return;
    
    setLoading(true);
    try {
      let complaintsData: Complaint[];
      if (isAdmin) {
        complaintsData = await complaintsService.getAllComplaints();
      } else {
        complaintsData = await complaintsService.getUserComplaints(userData.id);
      }
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-700';
      case 'investigating':
        return 'bg-orange-100 text-orange-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
      const matchesSearch = complaint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setSubmitting(true);
    try {
      const complaintData = {
        topic: newComplaint.topic,
        description: newComplaint.description,
        isAboutSomeone: newComplaint.isAboutSomeone,
        whoIsThisAbout: newComplaint.isAboutSomeone ? newComplaint.whoIsThisAbout : undefined,
        dateOfIncidence: newComplaint.dateUnknown ? undefined : (newComplaint.dateOfIncidence ? new Date(newComplaint.dateOfIncidence) : undefined),
        dateUnknown: newComplaint.dateUnknown,
        category: newComplaint.category,
        submittedBy: userData.id,
        submittedByName: newComplaint.isAnonymous ? undefined : userData.name,
        isAnonymous: newComplaint.isAnonymous
      };

      await complaintsService.submitComplaint(complaintData);
      
      setShowNewComplaint(false);
      setNewComplaint({
        topic: '',
        description: '',
        isAboutSomeone: false,
        whoIsThisAbout: '',
        dateOfIncidence: '',
        dateUnknown: false,
        category: 'workplace',
        isAnonymous: false
      });
      
      // Reload complaints
      loadComplaints();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !userData || !isAdmin) return;

    setSubmitting(true);
    try {
      await complaintsService.respondToComplaint(
        selectedComplaint.id,
        adminResponse,
        userData.id,
        userData.name
      );
      
      setAdminResponse('');
      setSelectedComplaint(null);
      loadComplaints();
    } catch (error) {
      console.error('Error responding to complaint:', error);
      alert('Failed to respond to complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: Complaint['status']) => {
    if (!isAdmin) return;

    try {
      await complaintsService.updateComplaintStatus(complaintId, newStatus);
      loadComplaints();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'Manage Complaints' : 'My Complaints'}
          </h1>
          <p className="text-lg text-gray-600">
            {isAdmin 
              ? 'Review and respond to submitted complaints'
              : 'Submit concerns and track resolution progress'
            }
            {openCount > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary-100 text-primary-700">
                {openCount} open complaint{openCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowNewComplaint(true)}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <PlusIcon className="h-5 w-5" />
            Submit Complaint
          </button>
        )}
      </div>

      {/* Security Notice */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {isAdmin ? 'Confidentiality Notice' : 'Your Privacy & Security'}
            </h3>
            <p className="text-blue-800 leading-relaxed">
              {isAdmin 
                ? 'All complaints are confidential and should be handled with utmost discretion. Only office team members have access to this information.'
                : 'We secure all complaints and only office team members will review complaints submitted. No action is ever taken against someone who submits a complaint. Even complaints about office staff can be submitted. Anonymous reporting is available for your protection.'
              }
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
              placeholder="Search complaints..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'submitted', label: 'Submitted', count: complaints.filter(c => c.status === 'submitted').length },
              { value: 'reviewing', label: 'Under Review', count: complaints.filter(c => c.status === 'reviewing').length },
              { value: 'investigating', label: 'Investigating', count: complaints.filter(c => c.status === 'investigating').length },
              { value: 'resolved', label: 'Resolved', count: complaints.filter(c => c.status === 'resolved').length },
              { value: 'closed', label: 'Closed', count: complaints.filter(c => c.status === 'closed').length },
              { value: 'all', label: 'All', count: complaints.length }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  filterStatus === tab.value
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    filterStatus === tab.value
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Topic of Complaint *
                  </label>
                  <input
                    type="text"
                    value={newComplaint.topic}
                    onChange={(e) => setNewComplaint({...newComplaint, topic: e.target.value})}
                    placeholder="What is this complaint about?"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Is this about someone? *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isAboutSomeone"
                        checked={newComplaint.isAboutSomeone === true}
                        onChange={() => setNewComplaint({...newComplaint, isAboutSomeone: true})}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isAboutSomeone"
                        checked={newComplaint.isAboutSomeone === false}
                        onChange={() => setNewComplaint({...newComplaint, isAboutSomeone: false, whoIsThisAbout: ''})}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                </div>

                {newComplaint.isAboutSomeone && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Who is this referring to? *
                    </label>
                    <input
                      type="text"
                      value={newComplaint.whoIsThisAbout}
                      onChange={(e) => setNewComplaint({...newComplaint, whoIsThisAbout: e.target.value})}
                      placeholder="Name or description of the person"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Incidence
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newComplaint.dateUnknown}
                        onChange={(e) => setNewComplaint({...newComplaint, dateUnknown: e.target.checked, dateOfIncidence: ''})}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-600">Unknown date</span>
                    </label>
                    <input
                      type="date"
                      value={newComplaint.dateOfIncidence}
                      onChange={(e) => setNewComplaint({...newComplaint, dateOfIncidence: e.target.value})}
                      disabled={newComplaint.dateUnknown}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none ${
                        newComplaint.dateUnknown ? 'bg-gray-100 text-gray-400' : ''
                      }`}
                    />
                  </div>
                </div>
                
                <div>
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
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                    placeholder="Please provide detailed information about the issue, including when it occurred, who was involved, and any other relevant details..."
                    rows={5}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    required
                  />
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

                {/* Security disclaimer */}
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-start">
                    <ShieldCheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm text-green-800 leading-relaxed">
                        <strong>Privacy Protection:</strong> We secure all complaints and only office team members will review complaints submitted. No action is ever taken against someone who submits a complaint. Even complaints about office staff can be submitted.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewComplaint(false)}
                    className="btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
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
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                {/* Status and Category */}
                <div className="flex flex-wrap gap-4">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(selectedComplaint.status)}`}>
                    {getStatusIcon(selectedComplaint.status)}
                    <span className="font-semibold capitalize">{selectedComplaint.status}</span>
                  </div>
                  <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg">
                    <span className="font-semibold">{categories.find(c => c.value === selectedComplaint.category)?.label}</span>
                  </div>
                  {isAdmin && selectedComplaint.assignedTo && (
                    <div className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg">
                      <span className="font-semibold">Assigned</span>
                    </div>
                  )}
                </div>
                
                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{selectedComplaint.topic}</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-line">{selectedComplaint.description}</p>
                      </div>
                    </div>

                    {/* About Someone */}
                    {selectedComplaint.isAboutSomeone && selectedComplaint.whoIsThisAbout && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <UserCircleIcon className="h-5 w-5" />
                          Person Involved
                        </h4>
                        <p className="text-gray-900 bg-yellow-50 p-3 rounded-lg">{selectedComplaint.whoIsThisAbout}</p>
                      </div>
                    )}

                    {/* Date of Incidence */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Date of Incidence
                      </h4>
                      <p className="text-gray-900">
                        {selectedComplaint.dateUnknown 
                          ? 'Unknown' 
                          : selectedComplaint.dateOfIncidence 
                            ? formatDate(selectedComplaint.dateOfIncidence)
                            : 'Not specified'
                        }
                      </p>
                    </div>

                    {/* Admin Response */}
                    {selectedComplaint.adminResponse && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <ChatBubbleLeftRightIcon className="h-5 w-5" />
                          Official Response
                        </h4>
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                          <p className="text-gray-800 leading-relaxed mb-3">{selectedComplaint.adminResponse}</p>
                          {selectedComplaint.respondedByName && selectedComplaint.respondedAt && (
                            <div className="text-sm text-green-700 font-medium">
                              — {selectedComplaint.respondedByName}, {formatDate(selectedComplaint.respondedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Admin Response Form */}
                    {isAdmin && !selectedComplaint.adminResponse && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Respond to Complaint</h4>
                        <form onSubmit={handleAdminResponse}>
                          <textarea
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                            placeholder="Provide your response to this complaint..."
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                            required
                          />
                          <div className="flex justify-end gap-3 mt-3">
                            <button 
                              type="submit" 
                              className="btn-primary"
                              disabled={submitting}
                            >
                              {submitting ? 'Responding...' : 'Submit Response'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold text-gray-900">Details</h4>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">Submitted:</span>
                        <p className="text-gray-900">{formatDate(selectedComplaint.submittedAt)}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">Submitted by:</span>
                        <p className="text-gray-900">
                          {selectedComplaint.isAnonymous 
                            ? 'Anonymous' 
                            : isAdmin 
                              ? selectedComplaint.submittedByName || 'User'
                              : 'You'
                          }
                        </p>
                      </div>

                      {selectedComplaint.resolvedAt && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Resolved:</span>
                          <p className="text-gray-900">{formatDate(selectedComplaint.resolvedAt)}</p>
                        </div>
                      )}
                    </div>

                    {/* Admin Controls */}
                    {isAdmin && (
                      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                        <h4 className="font-semibold text-blue-900">Admin Actions</h4>
                        
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">Status:</label>
                          <select
                            value={selectedComplaint.status}
                            onChange={(e) => handleStatusUpdate(selectedComplaint.id, e.target.value as Complaint['status'])}
                            className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="reviewing">Under Review</option>
                            <option value="investigating">Investigating</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map((complaint) => {
            const statusColors = getStatusColor(complaint.status);
            const StatusIcon = getStatusIcon(complaint.status);
            
            return (
              <div
                key={complaint.id}
                className="card hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedComplaint(complaint)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${statusColors} flex-shrink-0`}>
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{complaint.topic}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded ${statusColors}`}>
                            {StatusIcon}
                            <span className="font-semibold capitalize">{complaint.status}</span>
                          </div>
                          <span>{categories.find(c => c.value === complaint.category)?.label}</span>
                          <span>{formatDate(complaint.submittedAt)}</span>
                          <span>
                            {complaint.isAnonymous 
                              ? 'Anonymous' 
                              : isAdmin 
                                ? `By ${complaint.submittedByName || 'User'}`
                                : 'Your complaint'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed line-clamp-3 mb-4">
                      {complaint.description}
                    </p>

                    {/* Additional Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      {complaint.isAboutSomeone && (
                        <span className="flex items-center gap-1">
                          <UserCircleIcon className="h-4 w-4" />
                          About someone
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {complaint.dateUnknown 
                          ? 'Date unknown' 
                          : complaint.dateOfIncidence 
                            ? formatDate(complaint.dateOfIncidence)
                            : 'No date specified'
                        }
                      </span>
                      {complaint.adminResponse && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          Response received
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {complaint.assignedTo && isAdmin && (
                          <span>Assigned</span>
                        )}
                        {complaint.status === 'resolved' && complaint.resolvedAt && (
                          <span className="text-green-600 font-semibold">
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
              {searchTerm || filterStatus !== 'submitted'
                ? 'Try adjusting your search terms or filters.'
                : isAdmin 
                  ? 'No complaints have been submitted yet.'
                  : 'You haven\'t submitted any complaints yet.'}
            </p>
            {searchTerm || filterStatus !== 'submitted' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('submitted');
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