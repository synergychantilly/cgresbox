import React, { useState } from 'react';
import { XMarkIcon, CalendarDaysIcon, ClockIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CalendarEvent as FirebaseCalendarEvent } from '../../types/calendar';
import { deleteCalendarEvent, deleteRecurringEventSeries } from '../../lib/calendarService';
import { useAuth } from '../../contexts/AuthContext';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FirebaseCalendarEvent | null;
  onEdit?: (event: FirebaseCalendarEvent) => void;
  onDelete?: () => void;
}

export default function EventDetailModal({ isOpen, onClose, event, onEdit, onDelete }: EventDetailModalProps) {
  const { isAdmin } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !event) return null;

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

  const handleDelete = async () => {
    if (!event) return;

    const isRecurringEvent = event.isRecurring && event.recurrenceId;
    const confirmMessage = isRecurringEvent 
      ? `Are you sure you want to delete this recurring event series? This will delete ALL ${event.recurrenceType} occurrences of "${event.title}".`
      : `Are you sure you want to delete "${event.title}"?`;

    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      if (isRecurringEvent) {
        await deleteRecurringEventSeries(event.recurrenceId!);
      } else {
        await deleteCalendarEvent(event.id);
      }
      
      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (event && onEdit) {
      onEdit(event);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{event.icon}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
                <div className="flex items-center gap-2 mt-2 text-gray-600">
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                {event.isRecurring && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      🔄 Recurring {event.recurrenceType}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Event Details */}
          <div className="space-y-4">
            {/* Description */}
            {event.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* Event Information */}
            <div className="bg-primary-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-primary-700 mb-3">Event Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <CalendarDaysIcon className="h-4 w-4 text-primary-600" />
                  <span className="text-gray-700">
                    <span className="font-medium">Date:</span> {formatDate(event.date)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-lg">{event.icon}</span>
                  <span className="text-gray-700">
                    <span className="font-medium">Event Type:</span> Calendar Event
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <ClockIcon className="h-4 w-4 text-primary-600" />
                  <span className="text-gray-700">
                    <span className="font-medium">Created:</span> {event.createdAt.toLocaleDateString()}
                  </span>
                </div>

                {event.isRecurring && event.originalDate && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔄</span>
                    <span className="text-gray-700">
                      <span className="font-medium">Series Started:</span> {event.originalDate.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            {event.createdBy && (
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                Event ID: {event.id}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
            <div className="flex gap-2">
              {isAdmin && onEdit && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit {event.isRecurring ? 'Series' : 'Event'}
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  {isDeleting ? 'Deleting...' : `Delete ${event.isRecurring ? 'Series' : 'Event'}`}
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
