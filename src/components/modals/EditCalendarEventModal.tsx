import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { updateCalendarEvent, updateRecurringEventSeries } from '../../lib/calendarService';
import { CalendarEvent } from '../../types/calendar';
import { useAuth } from '../../contexts/AuthContext';

interface EditCalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  event: CalendarEvent | null;
}

interface EditEventForm {
  title: string;
  icon: string;
  description: string;
  date?: string; // Only for non-recurring events
}

const popularEmojis = ['📅', '🎉', '📝', '💼', '🏥', '👥', '🍰', '🎂', '💰', '🏆', '📊', '🎯', '⚡', '🔥', '✨', '🌟', '❤️', '🎨'];

export default function EditCalendarEventModal({ isOpen, onClose, onSuccess, event }: EditCalendarEventModalProps) {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EditEventForm>({
    title: '',
    icon: '📅',
    description: '',
    date: ''
  });

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        icon: event.icon,
        description: event.description,
        date: event.isRecurring ? undefined : event.date.toISOString().split('T')[0]
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !event) return;

    setIsLoading(true);
    try {
      if (event.isRecurring && event.recurrenceId) {
        // Update all events in the recurring series (title, description, icon only)
        await updateRecurringEventSeries(event.recurrenceId, {
          title: formData.title,
          icon: formData.icon,
          description: formData.description
        });
      } else {
        // Update single event (can include date)
        const updateData: any = {
          title: formData.title,
          icon: formData.icon,
          description: formData.description
        };

        if (formData.date) {
          updateData.date = new Date(formData.date + 'T00:00:00');
        }

        await updateCalendarEvent(event.id, updateData);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating calendar event:', error);
      alert('Failed to update calendar event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof EditEventForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !event) return null;

  const isRecurringEvent = event.isRecurring && event.recurrenceId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
              {isRecurringEvent && (
                <p className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-2 inline-block">
                  🔄 Recurring Event - Changes apply to all occurrences
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                required
              />
            </div>

            {/* Date - Only for non-recurring events */}
            {!isRecurringEvent && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  required
                />
              </div>
            )}

            {/* Recurring Event Info */}
            {isRecurringEvent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Recurring Event Information</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><span className="font-medium">Pattern:</span> {event.recurrenceType}</p>
                  <p><span className="font-medium">Original Date:</span> {event.originalDate?.toLocaleDateString()}</p>
                  <p><span className="font-medium">Note:</span> Date cannot be changed for recurring events. Only title, icon, and description can be modified.</p>
                </div>
              </div>
            )}

            {/* Icon Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Icon
              </label>
              <div className="grid grid-cols-9 gap-2 p-4 border border-gray-300 rounded-lg">
                {popularEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleChange('icon', emoji)}
                    className={`p-2 text-2xl rounded-lg border-2 transition-all hover:bg-gray-50 ${
                      formData.icon === emoji 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                placeholder="Or enter custom emoji..."
                className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                maxLength={2}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : `Update ${isRecurringEvent ? 'All Events' : 'Event'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
