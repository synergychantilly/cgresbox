import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  MegaphoneIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { CalendarEvent } from '../types/calendar';
import { Update } from '../types/updates';
import { UserDocumentStatus } from '../types/documents';
import { Question } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getUpcomingCalendarEvents } from '../lib/calendarService';
import { getActiveUpdates } from '../lib/updatesService';
import { userDocumentService, documentTemplateService } from '../lib/documentsService';
import { getQuestions } from '../lib/qaService';
import { getUsers } from '../lib/userService';
import { complaintsService } from '../lib/complaintsService';

interface DashboardProps {
  onPageChange: (page: string) => void;
}

export default function Dashboard({ onPageChange }: DashboardProps) {
  const { userData, currentUser } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<Update[]>([]);
  const [userDocuments, setUserDocuments] = useState<UserDocumentStatus[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [documentTemplates, setDocumentTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser || !userData) return;

      try {
        setLoading(true);
        
        // Load all data in parallel
        const promises: Promise<any>[] = [
          getUpcomingCalendarEvents(),
          getActiveUpdates(),
          userData.role === 'admin' 
            ? userDocumentService.getAllUserDocuments()
            : userDocumentService.getUserDocuments(currentUser.uid),
          getQuestions(),
          documentTemplateService.getAll() // Load templates for document names
        ];

        // For admins, also load user data and complaints
        if (userData.role === 'admin') {
          promises.push(getUsers('approved')); // Only get approved users
          promises.push(complaintsService.getAllComplaints()); // Load complaints for admin
        }

        const results = await Promise.all(promises);
        
        // Destructure based on whether we're admin or not
        if (userData.role === 'admin') {
          const [events, updates, documents, questions, templates, users, complaintsData] = results as [
            CalendarEvent[], 
            Update[], 
            UserDocumentStatus[], 
            Question[], 
            any[],
            any[],
            any[]
          ];
          
          setUpcomingEvents(events.slice(0, 5));
          setRecentUpdates(updates.slice(0, 3));
          setUserDocuments(documents);
          setRecentQuestions(questions.slice(0, 3));
          setDocumentTemplates(templates);
          setAllUsers(users);
          setComplaints(complaintsData);
        } else {
          const [events, updates, documents, questions, templates] = results as [
            CalendarEvent[], 
            Update[], 
            UserDocumentStatus[], 
            Question[],
            any[]
          ];
          
          setUpcomingEvents(events.slice(0, 5));
          setRecentUpdates(updates.slice(0, 3));
          setUserDocuments(documents);
          setRecentQuestions(questions.slice(0, 3));
          setDocumentTemplates(templates);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser, userData]);

  const getEventTypeColor = (icon: string) => {
    if (icon.includes('💰') || icon.includes('💵')) return 'bg-secondary-100 text-secondary-700';
    if (icon.includes('🎂') || icon.includes('🎉')) return 'bg-accent-100 text-accent-700';
    if (icon.includes('📅') || icon.includes('👥')) return 'bg-primary-100 text-primary-700';
    if (icon.includes('⚠️') || icon.includes('🚨')) return 'bg-destructive-100 text-destructive-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-destructive-100 text-destructive-700';
      case 'warning': return 'bg-amber-100 text-amber-700';
      case 'info': return 'bg-blue-100 text-blue-700';
      case 'celebration': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPendingDocuments = () => {
    if (userData?.role === 'admin') {
      // For admins, show pending documents only for approved (enabled) users
      const approvedUserIds = new Set(allUsers.map(user => user.id));
      
      return userDocuments.filter(doc => {
        const isPending = doc.status === 'not_started' || doc.status === 'viewed' || doc.status === 'started';
        const isApprovedUser = approvedUserIds.has(doc.userId);
        return isPending && isApprovedUser;
      });
    } else {
      // For regular users, show their own pending documents
      return userDocuments.filter(doc => 
        doc.status === 'not_started' || doc.status === 'viewed' || doc.status === 'started'
      );
    }
  };

  const getUnansweredQuestions = () => {
    return recentQuestions.filter(question => !question.isAnswered);
  };

  const getDocumentName = (templateId: string) => {
    const template = documentTemplates.find(t => t.id === templateId);
    return template?.title || 'Unknown Document';
  };

  const getPendingComplaints = () => {
    return complaints.filter(complaint => 
      complaint.status === 'submitted' || complaint.status === 'reviewing' || complaint.status === 'investigating'
    );
  };

  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 100) + (html.length > 100 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {userData?.name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Here's your overview for today, {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        {userData?.birthday && (
          <div className="mt-2">
            {(() => {
              const today = new Date();
              const birthday = new Date(userData.birthday);
              const birthdayThisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
              const daysUntilBirthday = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysUntilBirthday === 0) {
                return (
                  <p className="text-lg text-purple-600 font-semibold">
                    🎂 Happy Birthday! Hope you have a wonderful day!
                  </p>
                );
              } else if (daysUntilBirthday > 0 && daysUntilBirthday <= 7) {
                return (
                  <p className="text-sm text-purple-600">
                    🎂 Your birthday is in {daysUntilBirthday} day{daysUntilBirthday > 1 ? 's' : ''}!
                  </p>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-500">
              <CalendarDaysIcon className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-primary-700">Upcoming Events</p>
              <p className="text-2xl font-bold text-primary-900">{upcomingEvents.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-accent-50 to-accent-100 border-accent-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-accent-500">
              <MegaphoneIcon className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-accent-700">Active Updates</p>
              <p className="text-2xl font-bold text-accent-900">{recentUpdates.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-secondary-50 to-secondary-100 border-secondary-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-secondary-600">
              {userData?.role === 'admin' ? (
                <ExclamationTriangleIcon className="h-8 w-8 text-white" />
              ) : (
                <DocumentTextIcon className="h-8 w-8 text-white" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-secondary-700">
                {userData?.role === 'admin' ? 'Pending Complaints' : 'Your Pending Docs'}
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {userData?.role === 'admin' ? getPendingComplaints().length : getPendingDocuments().length}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-destructive-50 to-destructive-100 border-destructive-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-destructive-500">
              <QuestionMarkCircleIcon className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-destructive-700">Unanswered Questions</p>
              <p className="text-2xl font-bold text-destructive-900">{getUnansweredQuestions().length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
            <button
              onClick={() => onPageChange('calendar')}
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 text-lg"
            >
              View All
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming events</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">{event.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-gray-900 truncate">{event.title}</p>
                    <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                    {event.description && (
                      <p className="text-xs text-gray-500 truncate">{event.description}</p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getEventTypeColor(event.icon)}`}>
                    {formatDate(event.date)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Updates */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Latest Updates</h2>
            <button
              onClick={() => onPageChange('updates')}
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 text-lg"
            >
              View All
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            {recentUpdates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MegaphoneIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent updates</p>
              </div>
            ) : (
              recentUpdates.map((update) => (
                <div 
                  key={update.id} 
                  onClick={() => onPageChange('updates')}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-primary-300 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getUpdateTypeColor(update.type)}`}>
                      {update.type.toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-500">
                      {update.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                    {update.title}
                  </h3>
                  {update.expiration && (
                    <p className="text-xs text-amber-600 mt-2">
                      Expires: {update.expiration.toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Pending Actions</h2>
            <button
              onClick={() => onPageChange(userData?.role === 'admin' ? 'complaints' : 'documents')}
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 text-lg"
            >
              View All
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            {userData?.role === 'admin' ? (
              // Admin sees pending complaints
              getPendingComplaints().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending complaints!</p>
                </div>
              ) : (
                getPendingComplaints().slice(0, 5).map((complaint) => (
                  <div key={complaint.id} className="flex items-center space-x-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-gray-900 truncate">
                        {complaint.topic}
                      </p>
                      <p className="text-sm text-gray-600">
                        From: {complaint.isAnonymous ? 'Anonymous' : complaint.submittedByName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {complaint.submittedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`px-3 py-1 text-white text-sm font-semibold rounded-full ${
                        complaint.status === 'submitted' ? 'bg-red-500' :
                        complaint.status === 'reviewing' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}>
                        {complaint.status === 'submitted' ? 'New' :
                         complaint.status === 'reviewing' ? 'Reviewing' :
                         'Investigating'}
                      </span>
                    </div>
                  </div>
                ))
              )
            ) : (
              // Users see their pending documents
              getPendingDocuments().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>All documents are up to date!</p>
                </div>
              ) : (
                getPendingDocuments().slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <DocumentTextIcon className="h-8 w-8 text-amber-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-gray-900 truncate">
                        {getDocumentName(doc.documentTemplateId)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {doc.status === 'not_started' ? 'Not Started' :
                         doc.status === 'viewed' ? 'Viewed' :
                         'In Progress'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`px-3 py-1 text-white text-sm font-semibold rounded-full ${
                        doc.status === 'not_started' ? 'bg-red-500' :
                        doc.status === 'viewed' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}>
                        {doc.status === 'not_started' ? 'Action Needed' :
                         doc.status === 'viewed' ? 'Viewed' :
                         'In Progress'}
                      </span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Recent Questions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Community Q&A</h2>
            <button
              onClick={() => onPageChange('qa')}
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 text-lg"
            >
              View All
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            {recentQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <QuestionMarkCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent questions</p>
              </div>
            ) : (
              recentQuestions.map((question) => (
                <div key={question.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                      {question.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {question.isAnonymous ? 'Anonymous' : `by ${question.authorName}`}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{question.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      question.isAnswered 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {question.isAnswered ? `${question.answers?.length || 0} Answer${question.answers?.length !== 1 ? 's' : ''}` : 'Needs Answer'}
                    </span>
                    <span className="text-sm text-gray-500">{question.upvotes} upvote{question.upvotes !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {question.createdAt.toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-r from-primary-50 to-secondary-50">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => onPageChange('complaints')}
            className="btn-primary flex items-center justify-center gap-3"
          >
            <ExclamationTriangleIcon className="h-6 w-6" />
            Submit Complaint
          </button>
          <button
            onClick={() => onPageChange('qa')}
            className="btn-secondary flex items-center justify-center gap-3"
          >
            <QuestionMarkCircleIcon className="h-6 w-6" />
            Ask Question
          </button>
          <button
            onClick={() => onPageChange('documents')}
            className="btn-secondary flex items-center justify-center gap-3"
          >
            <DocumentTextIcon className="h-6 w-6" />
            Upload Document
          </button>
          {/* <button
            onClick={() => onPageChange('resources')}
            className="btn-secondary flex items-center justify-center gap-3"
          >
            <MegaphoneIcon className="h-6 w-6" />
            Browse Resources
          </button> */}
        </div>
      </div>
    </div>
  );
}
