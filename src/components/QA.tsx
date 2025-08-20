import React, { useState, useEffect } from 'react';
import {
  QuestionMarkCircleIcon,
  PlusIcon,
  HandThumbUpIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  EyeSlashIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
} from '@heroicons/react/24/solid';
import { Question, Answer, EditRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  getQuestions,
  createQuestion,
  createAnswer,
  upvoteQuestion,
  upvoteAnswer,
  deleteQuestion,
  deleteAnswer,
  toggleCommentsDisabled,
  acceptAnswer,
  createEditRequest,
  getEditRequests,
  getUserEditRequests,
  approveEditRequest,
  rejectEditRequest
} from '../lib/qaService';

const categories = ['General', 'Caregiver', 'Office', 'Safety', 'Clients', 'Training', 'Other'];

export default function QA() {
  const { currentUser, userData, isAdmin } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered' | 'my-questions'>('all');
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [userEditRequests, setUserEditRequests] = useState<EditRequest[]>([]);
  const [showEditRequests, setShowEditRequests] = useState(false);

  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    category: 'General' as const,
    tags: '',
    isAnonymous: false
  });

  const [newAnswer, setNewAnswer] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editReason, setEditReason] = useState('');

  // Load questions and edit requests
  useEffect(() => {
    if (currentUser && userData && userData.status === 'approved') {
      loadQuestions();
      loadUserEditRequests();
      if (isAdmin) {
        loadEditRequests();
      }
    }
  }, [currentUser, userData, isAdmin]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsList = await getQuestions();
      setQuestions(questionsList);
    } catch (error) {
      console.error('Error loading questions:', error);
      // Set empty array on error to prevent UI issues
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEditRequests = async () => {
    try {
      const requests = await getEditRequests();
      setEditRequests(requests.filter(req => req.status === 'pending'));
    } catch (error) {
      console.error('Error loading edit requests:', error);
      // Set empty array on error to prevent UI issues
      setEditRequests([]);
    }
  };

  const loadUserEditRequests = async () => {
    if (!currentUser) return;
    try {
      const requests = await getUserEditRequests(currentUser.uid);
      const pendingRequests = requests.filter(req => req.status === 'pending');
      setUserEditRequests(pendingRequests);
    } catch (error) {
      console.error('Error loading user edit requests:', error);
      // Set empty array on error to prevent UI issues
      setUserEditRequests([]);
    }
  };

  const filteredQuestions = questions
    .filter(question => {
      const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = !selectedCategory || question.category === selectedCategory;
      const matchesFilter = 
        filter === 'all' ? true :
        filter === 'answered' ? question.isAnswered :
        filter === 'unanswered' ? !question.isAnswered :
        filter === 'my-questions' ? question.author === currentUser?.uid :
        true;
      
      return matchesSearch && matchesCategory && matchesFilter;
    })
    .sort((a, b) => {
      // Sort by creation date, newest first
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  // Get category counts for badges
  const getCategoryUnansweredCount = (category: string) => {
    return questions.filter(q => q.category === category && !q.isAnswered).length;
  };

  // Check if a question has pending edit requests
  const hasEditRequestPending = (questionId: string) => {
    return userEditRequests.some(req => req.questionId === questionId && req.status === 'pending');
  };

  const handleUpvoteQuestion = async (questionId: string) => {
    if (!currentUser) return;
    try {
      await upvoteQuestion(questionId, currentUser.uid);
      await loadQuestions();
    } catch (error) {
      console.error('Error upvoting question:', error);
    }
  };

  const handleUpvoteAnswer = async (answerId: string) => {
    if (!currentUser) return;
    try {
      await upvoteAnswer(answerId, currentUser.uid);
      await loadQuestions();
    } catch (error) {
      console.error('Error upvoting answer:', error);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userData) return;

    try {
      const tags = newQuestion.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      await createQuestion({
        title: newQuestion.title,
        content: newQuestion.content,
        category: newQuestion.category,
        tags,
        author: currentUser.uid,
        authorName: userData.name,
        isAnonymous: newQuestion.isAnonymous
      });

      setShowAskQuestion(false);
      setNewQuestion({
        title: '',
        content: '',
        category: 'General',
        tags: '',
        isAnonymous: false
      });
      
      await loadQuestions();
      await loadUserEditRequests();
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!currentUser || !userData) return;

    try {
      await createAnswer({
        questionId,
        content: newAnswer,
        author: currentUser.uid,
        authorName: userData.name,
        isAdminResponse: isAdmin
      });

      setNewAnswer('');
      setShowAnswerForm(null);
      await loadQuestions();
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!isAdmin || !currentUser) return;
    
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        await deleteQuestion(questionId, currentUser.uid);
        await loadQuestions();
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  const handleToggleComments = async (questionId: string) => {
    if (!isAdmin) return;
    
    try {
      await toggleCommentsDisabled(questionId);
      await loadQuestions();
    } catch (error) {
      console.error('Error toggling comments:', error);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!isAdmin) return;
    
    try {
      await acceptAnswer(answerId);
      await loadQuestions();
    } catch (error) {
      console.error('Error accepting answer:', error);
    }
  };

  const handleDeleteAnswer = async (answerId: string, answerAuthor: string) => {
    if (!currentUser) return;
    
    const canDelete = isAdmin || answerAuthor === currentUser.uid;
    if (!canDelete) {
      alert('You can only delete your own answers.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this answer? This action cannot be undone.')) {
      try {
        await deleteAnswer(answerId, currentUser.uid, isAdmin);
        await loadQuestions();
      } catch (error) {
        console.error('Error deleting answer:', error);
        alert('Failed to delete answer. Please try again.');
      }
    }
  };

  const handleSubmitEditRequest = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!currentUser || !userData) return;

    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    try {
      await createEditRequest({
        questionId,
        requestedBy: currentUser.uid,
        requestedByName: userData.name,
        originalContent: question.content,
        newContent: editContent,
        reason: editReason
      });

      setShowEditForm(null);
      setEditContent('');
      setEditReason('');
      await loadUserEditRequests();
      alert('Edit request submitted successfully!');
    } catch (error) {
      console.error('Error submitting edit request:', error);
    }
  };

  const handleApproveEditRequest = async (requestId: string) => {
    if (!isAdmin || !currentUser || !userData) return;
    
    try {
      await approveEditRequest(requestId, currentUser.uid, userData.name);
      await loadEditRequests();
      await loadUserEditRequests();
      await loadQuestions();
    } catch (error) {
      console.error('Error approving edit request:', error);
    }
  };

  const handleRejectEditRequest = async (requestId: string) => {
    if (!isAdmin || !currentUser || !userData) return;
    
    try {
      await rejectEditRequest(requestId, currentUser.uid, userData.name);
      await loadEditRequests();
      await loadUserEditRequests();
    } catch (error) {
      console.error('Error rejecting edit request:', error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Only show "Just now" for less than 1 minute
    if (diffMinutes < 1) return 'Just now';
    
    // For everything else, show detailed date/time
    const timeOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    // Add year if it's not current year
    if (date.getFullYear() !== now.getFullYear()) {
      timeOptions.year = 'numeric';
    }
    
    return date.toLocaleString('en-US', timeOptions);
  };

  const unansweredCount = questions.filter(q => !q.isAnswered).length;
  
  if (!currentUser) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Please Login</h3>
        <p className="text-gray-600">You need to be logged in to view the Q&A community.</p>
      </div>
    );
  }

  if (!userData || userData.status !== 'approved') {
    return (
      <div className="card text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Pending Approval</h3>
        <p className="text-gray-600">Your account is pending approval. Please wait for an administrator to approve your access.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading questions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Q&A Community</h1>
          <p className="text-lg text-gray-600">
            Ask questions, share knowledge, and get help from your colleagues
            {unansweredCount > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-accent-100 text-accent-700">
                {unansweredCount} need answers
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {isAdmin && editRequests.length > 0 && (
            <button
              onClick={() => setShowEditRequests(true)}
              className="btn-secondary flex items-center gap-2 whitespace-nowrap"
            >
              <ExclamationTriangleIcon className="h-5 w-5" />
              Edit Requests ({editRequests.length})
            </button>
          )}
          <button
            onClick={() => setShowAskQuestion(true)}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <PlusIcon className="h-5 w-5" />
            Ask Question
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions and answers..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${
              !selectedCategory
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map(category => {
            const unansweredCount = getCategoryUnansweredCount(category);
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                className={`relative px-4 py-2 rounded-full font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
                {unansweredCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unansweredCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-secondary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Questions ({questions.length})
          </button>
          <button
            onClick={() => setFilter('unanswered')}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
              filter === 'unanswered'
                ? 'bg-accent-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Needs Answers ({unansweredCount})
          </button>
          <button
            onClick={() => setFilter('answered')}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
              filter === 'answered'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Answered ({questions.filter(q => q.isAnswered).length})
          </button>
          <button
            onClick={() => setFilter('my-questions')}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
              filter === 'my-questions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            My Questions ({questions.filter(q => q.author === currentUser?.uid).length})
          </button>
        </div>
      </div>

      {/* Ask Question Modal */}
      {showAskQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Ask a Question</h2>
              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Question Title</label>
                  <input
                    type="text"
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                    placeholder="What's your question?"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Question Details</label>
                  <textarea
                    value={newQuestion.content}
                    onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                    placeholder="Provide more details about your question..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={newQuestion.category}
                      onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={newQuestion.tags}
                      onChange={(e) => setNewQuestion({...newQuestion, tags: e.target.value})}
                      placeholder="tag1, tag2, tag3"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={newQuestion.isAnonymous}
                    onChange={(e) => setNewQuestion({...newQuestion, isAnonymous: e.target.checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                    Ask anonymously
                  </label>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAskQuestion(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Post Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Requests Modal */}
      {showEditRequests && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Pending Edit Requests</h2>
                <button
                  onClick={() => setShowEditRequests(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {editRequests.map((request) => (
                  <div key={request.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">Edit Request from {request.requestedByName}</h3>
                        <p className="text-sm text-gray-600">{formatDate(request.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveEditRequest(request.id)}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectEditRequest(request.id)}
                          className="btn-secondary text-sm px-3 py-1"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Reason:</p>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Original Content:</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                          {request.originalContent}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Proposed Changes:</p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                          {request.newContent}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {editRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pending edit requests
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => {
            const questionUpvoted = question.upvotedBy.includes(currentUser?.uid || '');
            const isQuestionOwner = question.author === currentUser?.uid;
            
            return (
              <div key={question.id} className="card hover:shadow-lg transition-shadow">
                {/* Admin Controls */}
                {isAdmin && (
                  <div className="flex items-center justify-end gap-2 mb-4 pb-2 border-b border-gray-200">
                    <button
                      onClick={() => handleToggleComments(question.id)}
                      className={`text-sm px-3 py-1 rounded-full font-semibold ${
                        question.commentsDisabled
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {question.commentsDisabled ? (
                        <>
                          <EyeSlashIcon className="h-4 w-4 inline mr-1" />
                          Enable Comments
                        </>
                      ) : (
                        <>
                          <EyeIcon className="h-4 w-4 inline mr-1" />
                          Disable Comments
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-sm px-3 py-1 rounded-full font-semibold bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      <TrashIcon className="h-4 w-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                )}

                {/* Question Header */}
                <div className="flex items-start gap-3 mb-3">
                  <button
                    onClick={() => handleUpvoteQuestion(question.id)}
                    className="flex flex-col items-center space-y-1 flex-shrink-0"
                    disabled={!currentUser}
                  >
                    {questionUpvoted ? (
                      <HandThumbUpIconSolid className="h-5 w-5 text-primary-600" />
                    ) : (
                      <HandThumbUpIcon className="h-5 w-5 text-gray-400 hover:text-primary-600" />
                    )}
                    <span className={`text-xs font-semibold ${
                      questionUpvoted ? 'text-primary-600' : 'text-gray-600'
                    }`}>
                      {question.upvotes}
                    </span>
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{question.title}</h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {question.isAnswered ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-semibold">
                            <CheckCircleIcon className="h-3 w-3" />
                            Answered
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-semibold">
                            <ClockIcon className="h-3 w-3" />
                            Needs Answer
                          </div>
                        )}
                        {hasEditRequestPending(question.id) && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                            <ClockIcon className="h-3 w-3" />
                            Pending Approval
                          </div>
                        )}
                        {question.commentsDisabled && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            <EyeSlashIcon className="h-3 w-3" />
                            Disabled
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <UserCircleIcon className="h-4 w-4" />
                        <span>{question.isAnonymous ? 'Anonymous' : question.authorName}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(question.createdAt)}</span>
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                        {question.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 leading-relaxed mb-3 text-sm">{question.content}</p>
                    
                    {/* Tags */}
                    {question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {question.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        <span>{question.answers.length} {question.answers.length === 1 ? 'answer' : 'answers'}</span>
                      </div>
                      
                      {!question.commentsDisabled && currentUser && (
                        <button
                          onClick={() => setShowAnswerForm(showAnswerForm === question.id ? null : question.id)}
                          className="text-primary-600 hover:text-primary-700 font-semibold"
                        >
                          Answer
                        </button>
                      )}
                      
                      {isQuestionOwner && !question.isAnonymous && (
                        <button
                          onClick={() => {
                            setShowEditForm(question.id);
                            setEditContent(question.content);
                          }}
                          className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Answer Form */}
                {showAnswerForm === question.id && !question.commentsDisabled && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <form onSubmit={(e) => handleSubmitAnswer(e, question.id)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Answer</label>
                        <textarea
                          value={newAnswer}
                          onChange={(e) => setNewAnswer(e.target.value)}
                          placeholder="Share your knowledge..."
                          rows={4}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAnswerForm(null);
                            setNewAnswer('');
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                          Post Answer
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Edit Request Form */}
                {showEditForm === question.id && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <form onSubmit={(e) => handleSubmitEditRequest(e, question.id)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Proposed Changes</label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Enter your proposed changes..."
                          rows={4}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Edit</label>
                        <textarea
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                          placeholder="Explain why you want to make these changes..."
                          rows={2}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditForm(null);
                            setEditContent('');
                            setEditReason('');
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                          Submit Edit Request
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Answers */}
                {question.answers.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {question.answers.length === 1 ? 'Answer' : 'Answers'}
                    </h4>
                    <div className="space-y-4">
                      {question.answers
                        .sort((a, b) => {
                          // Best answers always come first
                          if (a.isAccepted && !b.isAccepted) return -1;
                          if (!a.isAccepted && b.isAccepted) return 1;
                          // Then sort by creation date
                          return a.createdAt.getTime() - b.createdAt.getTime();
                        })
                        .map((answer) => {
                        const answerUpvoted = answer.upvotedBy.includes(currentUser?.uid || '');
                        
                        return (
                          <div key={answer.id} className={`flex items-start gap-4 p-4 rounded-lg ${
                            answer.isAccepted 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-md' 
                              : answer.isAdminResponse
                                ? 'bg-blue-50 border border-blue-200'
                                : 'bg-gray-50'
                          }`}>
                            <button
                              onClick={() => handleUpvoteAnswer(answer.id)}
                              className="flex flex-col items-center space-y-1 flex-shrink-0"
                              disabled={!currentUser}
                            >
                              {answerUpvoted ? (
                                <HandThumbUpIconSolid className="h-5 w-5 text-primary-600" />
                              ) : (
                                <HandThumbUpIcon className="h-5 w-5 text-gray-400 hover:text-primary-600" />
                              )}
                              <span className={`text-xs font-semibold ${
                                answerUpvoted ? 'text-primary-600' : 'text-gray-600'
                              }`}>
                                {answer.upvotes}
                              </span>
                            </button>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <UserCircleIcon className="h-4 w-4" />
                                    <span className={`font-semibold ${
                                      answer.isAdminResponse ? 'text-blue-700' : ''
                                    }`}>
                                      {answer.authorName}
                                      {answer.isAdminResponse && (
                                        <ShieldCheckIcon className="h-4 w-4 inline ml-1 text-blue-600" />
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400">{formatDate(answer.createdAt)}</span>
                                  {answer.isAccepted && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-secondary-200 text-secondary-800 rounded-full text-xs font-semibold">
                                      <CheckCircleIcon className="h-3 w-3" />
                                      Best Answer
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {isAdmin && !answer.isAccepted && (
                                    <button
                                      onClick={() => handleAcceptAnswer(answer.id)}
                                      className="text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-full font-semibold"
                                    >
                                      Mark as Best
                                    </button>
                                  )}
                                  {(isAdmin || answer.author === currentUser?.uid) && (
                                    <button
                                      onClick={() => handleDeleteAnswer(answer.id, answer.author)}
                                      className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-full font-semibold"
                                    >
                                      <TrashIcon className="h-3 w-3 inline mr-1" />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-800 leading-relaxed">{answer.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="card text-center py-12">
            <QuestionMarkCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'All' || filter !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'Be the first to ask a question in the community!'}
            </p>
            <button
              onClick={() => setShowAskQuestion(true)}
              className="btn-primary"
            >
              Ask the First Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
