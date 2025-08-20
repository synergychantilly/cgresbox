import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { CalendarEvent } from '../types';
import { CalendarEvent as FirebaseCalendarEvent } from '../types/calendar';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToCalendarEvents } from '../lib/calendarService';
import AddCalendarEventModal from './modals/AddCalendarEventModal';
import EventDetailModal from './modals/EventDetailModal';
import EditCalendarEventModal from './modals/EditCalendarEventModal';

export default function Calendar() {
  const { isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [firebaseEvents, setFirebaseEvents] = useState<FirebaseCalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FirebaseCalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FirebaseCalendarEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Subscribe to Firebase events
  useEffect(() => {
    const unsubscribe = subscribeToCalendarEvents((events) => {
      setFirebaseEvents(events);
    });

    return () => unsubscribe();
  }, []);

  const handleEventClick = (event: FirebaseCalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: FirebaseCalendarEvent) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleDeleteEvent = () => {
    // Events will automatically refresh via Firebase subscription
    console.log('Event deleted successfully');
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'payday': return { bg: 'bg-secondary-500', text: 'text-white', border: 'border-secondary-500' };
      case 'birthday': return { bg: 'bg-accent-500', text: 'text-white', border: 'border-accent-500' };
      case 'meeting': return { bg: 'bg-primary-500', text: 'text-white', border: 'border-primary-500' };
      case 'important': return { bg: 'bg-destructive-500', text: 'text-white', border: 'border-destructive-500' };
      case 'event': return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500' };
      default: return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500' };
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventsForDate = (date: Date) => {
    return firebaseEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const upcomingEvents = firebaseEvents
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10);

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-lg text-gray-600">Upcoming events and important dates</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setViewMode('month')}
              className="btn-secondary"
            >
              Month View
            </button>
            {isAdmin && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Add Event
              </button>
            )}
          </div>
        </div>

        {/* Upcoming Events List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
          <div className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No upcoming events</p>
                <p className="text-sm">Create an event to get started!</p>
              </div>
            ) : (
              upcomingEvents.map((event) => {
              return (
                <div 
                  key={event.id} 
                  onClick={() => handleEventClick(event)}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-primary-300 transition-all cursor-pointer"
                >
                  <div className="text-2xl mt-1">{event.icon}</div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <p className="text-gray-600 truncate">{event.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{formatDate(event.date)}</span>
                          <span>Calendar Event</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
                          View Details
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
          {upcomingEvents.length > 0 && (
            <div className="text-center mt-4 text-sm text-gray-500">
              💡 Click on any event to view details
            </div>
          )}
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-lg text-gray-600">Upcoming events and important dates</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setViewMode('list')}
            className="btn-secondary"
          >
            List View
          </button>
          {isAdmin && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="p-2 h-24 sm:h-32"></div>;
            }

            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`p-2 h-24 sm:h-32 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  isToday ? 'bg-primary-50 border-primary-300' : ''
                } ${
                  isSelected ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isToday ? 'text-primary-700' : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => {
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary-50 border border-primary-200 truncate cursor-pointer hover:bg-primary-100 transition-colors"
                        title={`${event.icon} ${event.title} - Click to view details`}
                      >
                        <span className="text-sm">{event.icon}</span>
                        <span className="text-primary-700 font-medium truncate">{event.title}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(day);
                      }}
                      className="text-xs text-gray-500 px-2 flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
                      title="Click to see all events for this day"
                    >
                      <span className="text-sm">📅</span>
                      <span>+{dayEvents.length - 2} more</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Helpful tip */}
        {firebaseEvents.length > 0 && (
          <div className="text-center mt-4 text-sm text-gray-500">
            💡 Click on events to view details, or click dates to see all events
          </div>
        )}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Events for {formatDate(selectedDate)}
          </h3>
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map((event) => {
                return (
                  <div 
                    key={event.id} 
                    onClick={() => handleEventClick(event)}
                    className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md hover:border-primary-300 transition-all"
                  >
                    <div className="text-2xl">{event.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <p className="text-gray-600 text-sm truncate">{event.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
                        View Details
                      </span>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(event.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600">No events scheduled for this date.</p>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      <AddCalendarEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Events will be automatically updated via the Firebase subscription
          console.log('Calendar event created successfully');
        }}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Edit Event Modal */}
      <EditCalendarEventModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSuccess={() => {
          console.log('Event updated successfully');
        }}
      />
    </div>
  );
}
