import React from 'react';
import {
  CalendarDaysIcon,
  MegaphoneIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { CalendarEvent, Announcement, Document, Question, Complaint } from '../types';

interface DashboardProps {
  onPageChange: (page: string) => void;
}

// Empty arrays - data will be loaded from Firebase
const upcomingEvents: CalendarEvent[] = [];
const recentAnnouncements: Announcement[] = [];
const pendingDocuments: Document[] = [];
const recentQuestions: Question[] = [];

export default function Dashboard({ onPageChange }: DashboardProps) {
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'payday': return 'bg-secondary-100 text-secondary-700';
      case 'birthday': return 'bg-accent-100 text-accent-700';
      case 'meeting': return 'bg-primary-100 text-primary-700';
      case 'important': return 'bg-destructive-100 text-destructive-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAnnouncementTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-destructive-100 text-destructive-700';
      case 'warning': return 'bg-accent-100 text-accent-700';
      case 'info': return 'bg-primary-100 text-primary-700';
      case 'celebration': return 'bg-secondary-100 text-secondary-700';
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

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-lg text-gray-600">
          Here's your overview for today, {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
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
              <p className="text-sm font-semibold text-accent-700">New Updates</p>
              <p className="text-2xl font-bold text-accent-900">{recentAnnouncements.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-secondary-50 to-secondary-100 border-secondary-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-secondary-600">
              <DocumentTextIcon className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-secondary-700">Pending Docs</p>
              <p className="text-2xl font-bold text-secondary-900">{pendingDocuments.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-destructive-50 to-destructive-100 border-destructive-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-destructive-500">
              <QuestionMarkCircleIcon className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-destructive-700">Open Questions</p>
              <p className="text-2xl font-bold text-destructive-900">{recentQuestions.length}</p>
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
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-shrink-0">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getEventTypeColor(event.type)}`}>
                    {formatDate(event.date)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 truncate">{event.title}</p>
                  <p className="text-sm text-gray-600 capitalize">{event.type.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
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
            {recentAnnouncements.map((announcement) => (
              <div key={announcement.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getAnnouncementTypeColor(announcement.type)}`}>
                    {announcement.type.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-500">
                    {announcement.publishedAt.toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{announcement.title}</h3>
                <p className="text-gray-700 text-sm line-clamp-2">{announcement.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Pending Actions</h2>
            <button
              onClick={() => onPageChange('documents')}
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 text-lg"
            >
              View All
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            {pendingDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center space-x-4 p-3 bg-accent-50 border border-accent-200 rounded-lg">
                <DocumentTextIcon className="h-8 w-8 text-accent-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 truncate">{doc.title}</p>
                  <p className="text-sm text-gray-600">{doc.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="px-3 py-1 bg-accent-500 text-white text-sm font-semibold rounded-full">
                    Action Required
                  </span>
                </div>
              </div>
            ))}
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
            {recentQuestions.map((question) => (
              <div key={question.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                    {question.category}
                  </span>
                  <span className="text-sm text-gray-500">by {question.authorName}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{question.title}</h3>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    question.isAnswered 
                      ? 'bg-secondary-100 text-secondary-700' 
                      : 'bg-destructive-100 text-destructive-700'
                  }`}>
                    {question.isAnswered ? 'Answered' : 'Needs Answer'}
                  </span>
                  <span className="text-sm text-gray-500">{question.upvotes} upvotes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-r from-primary-50 to-secondary-50">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <button
            onClick={() => onPageChange('resources')}
            className="btn-secondary flex items-center justify-center gap-3"
          >
            <MegaphoneIcon className="h-6 w-6" />
            Browse Resources
          </button>
        </div>
      </div>
    </div>
  );
}
